<script setup lang="ts">
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Mark, MarkFull } from '@/components/00.shared/services/mark/index.type'
import type { MapPoint } from '@/types/shared/map'
import * as maplibregl from 'maplibre-gl'
import { distanceMeters, formatDistance } from '@/components/00.shared/lib/geo'
import { useCachedImage } from '@/components/00.shared/lib/imageCache'
import { markApi } from '@/components/00.shared/services/mark'

const props = withDefaults(defineProps<{
  map: MapLibreMap
  mark: Mark
  userCoordinates: MapPoint | null
  /** Точка привязки: у метки из группы — общая точка группы. */
  coordinates?: MapPoint | null
  /** Смещение метки в раскрытом веере — карточка встаёт над смещённой меткой. */
  offset?: [number, number] | null
  /** Позиция в листании: «2 из 7». */
  position?: { index: number, total: number } | null
  swipeable?: boolean
  enterFrom?: 'pop' | 'left' | 'right'
  /** Карточка закрыта и доигрывает анимацию исчезновения. */
  closing?: boolean
}>(), {
  closing: false,
  coordinates: null,
  offset: null,
  position: null,
  swipeable: true,
  enterFrom: 'pop',
})

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'next'): void
  (e: 'prev'): void
}>()

// --- Листание свайпом ---
const SWIPE_THRESHOLD = 60
const dragX = ref(0)
const dragging = ref(false)
let gesture: { x: number, y: number } | null = null
let suppressClick = false

function onPointerDown(event: PointerEvent) {
  if (!props.swipeable || !props.position)
    return
  gesture = { x: event.clientX, y: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!gesture)
    return
  const dx = event.clientX - gesture.x
  const dy = event.clientY - gesture.y
  if (!dragging.value && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy))
    dragging.value = true
  if (!dragging.value)
    return
  // На краях списка — сопротивление, чтобы было понятно, что дальше меток нет
  const atStart = props.position!.index === 1 && dx > 0
  const atEnd = props.position!.index === props.position!.total && dx < 0
  dragX.value = atStart || atEnd ? dx * 0.25 : dx
}

function onPointerUp() {
  if (!gesture)
    return
  gesture = null
  if (dragging.value) {
    suppressClick = true
    if (dragX.value <= -SWIPE_THRESHOLD)
      emit('next')
    else if (dragX.value >= SWIPE_THRESHOLD)
      emit('prev')
  }
  dragging.value = false
  dragX.value = 0
}

function onClick() {
  if (suppressClick) {
    suppressClick = false
    return
  }
  emit('open')
}

/** Высота пина метки: карточка встаёт над ним. */
const MARKER_OFFSET_Y = -66

// Отдельный элемент для Marker + teleport, как в UMarker: Marker переносит элемент в контейнер карты,
// и корень компонента нельзя отдавать ему напрямую — Vue использует его как якорь при вставке соседей
const el = document.createElement('div')
el.className = 'mark-preview'
const isReady = ref(false)
let anchor: maplibregl.Marker | null = null

const details = shallowRef<MarkFull | null>(null)
const photo = useCachedImage(() => props.mark.photos?.[0])

watch(() => props.mark.id, async (id) => {
  details.value = null
  try {
    const full = await markApi.getMarkFull(id)
    if (full.id === props.mark.id)
      details.value = full
  }
  catch {
    // Карточка остаётся с названием и фото — подробности откроются в шторке
  }
}, { immediate: true })

function formatTimeLeft(endAt?: string): string | null {
  const end = endAt ? new Date(endAt).getTime() : Number.NaN
  if (!Number.isFinite(end))
    return null
  const minutes = Math.round((end - Date.now()) / 60000)
  if (minutes <= 0)
    return 'завершилась'
  if (minutes < 60)
    return `ещё ${minutes} мин`
  const hours = Math.round(minutes / 60)
  if (hours < 48)
    return `ещё ${hours} ч`
  return `ещё ${Math.round(hours / 24)} д`
}

const distance = computed(() => props.userCoordinates
  ? formatDistance(distanceMeters(props.userCoordinates, props.mark.geom.coordinates as MapPoint))
  : null)

const meta = computed(() => [
  details.value?.owner?.username ? `@${details.value.owner.tag || details.value.owner.username}` : null,
  formatTimeLeft(details.value?.date?.endAt),
  distance.value,
].filter(Boolean).join(' · '))

/** Свободная от интерфейса зона экрана: под строкой поиска, над нижней навигацией. */
const SAFE_TOP = 96
const SAFE_BOTTOM = 124
const SAFE_SIDE = 12

/** Карточка у края экрана — сдвигаем карту ровно настолько, чтобы карточка была видна целиком. */
function keepInView() {
  const card = el.firstElementChild as HTMLElement | null
  if (!card)
    return
  const rect = card.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const dx = rect.left < SAFE_SIDE
    ? rect.left - SAFE_SIDE
    : rect.right > width - SAFE_SIDE ? rect.right - (width - SAFE_SIDE) : 0
  const dy = rect.top < SAFE_TOP
    ? rect.top - SAFE_TOP
    : rect.bottom > height - SAFE_BOTTOM ? rect.bottom - (height - SAFE_BOTTOM) : 0
  if (dx || dy)
    props.map.panBy([dx, dy], { duration: 300 })
}

/** Меряем после анимации появления: пока карточка в scale(0.85), её прямоугольник меньше настоящего. */
function afterEnterAnimation(run: () => void) {
  const card = el.firstElementChild as HTMLElement | null
  let done = false
  const once = () => {
    if (done)
      return
    done = true
    run()
  }
  card?.addEventListener('animationend', once, { once: true })
  setTimeout(once, 320)
}

function keepInViewWhenSettled() {
  // Во время перелёта к метке позиция карточки ещё меняется — меряем после остановки
  if (props.map.isMoving())
    props.map.once('moveend', () => afterEnterAnimation(keepInView))
  else
    afterEnterAnimation(keepInView)
}

onMounted(() => {
  // Marker сам двигает карточку вместе с картой — без пересчёта позиции на каждом кадре
  const [spreadX, spreadY] = props.offset ?? [0, 0]
  anchor = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [spreadX, MARKER_OFFSET_Y + spreadY] })
    .setLngLat(props.coordinates ?? props.mark.geom.coordinates as MapPoint)
    .addTo(props.map)
  isReady.value = true
  if (!props.closing)
    nextTick(keepInViewWhenSettled)
})

watch(() => props.coordinates ?? props.mark.geom.coordinates, coordinates => anchor?.setLngLat(coordinates as MapPoint))
watch(() => props.offset, (offset) => {
  const [spreadX, spreadY] = offset ?? [0, 0]
  anchor?.setOffset([spreadX, MARKER_OFFSET_Y + spreadY])
})

onBeforeUnmount(() => {
  anchor?.remove()
  anchor = null
})
</script>

<template>
  <div style="display: none;" />

  <teleport
    v-if="isReady"
    :to="el"
  >
    <button
      class="mark-preview__card"
      :class="closing
        ? 'mark-preview__card--closing'
        : [`mark-preview__card--from-${enterFrom}`, { 'mark-preview__card--dragging': dragging }]"
      :style="dragX ? { transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)` } : undefined"
      type="button"
      :aria-label="`Открыть метку «${mark.markName}»`"
      @click.stop="onClick"
      @pointerdown.stop="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @mousedown.stop
      @touchstart.stop
    >
      <span class="mark-preview__media">
        <img
          v-if="photo"
          :src="photo"
          alt=""
        >
        <u-icon
          v-else
          :icon="details?.category?.icon || 'app:pin'"
          width="22"
        />
      </span>

      <span class="mark-preview__text">
        <span
          v-if="details?.category?.categoryName"
          class="mark-preview__category"
        >{{ details.category.categoryName }}</span>
        <span class="mark-preview__title">{{ mark.markName }}</span>
        <span
          v-if="meta"
          class="mark-preview__meta"
        >{{ meta }}</span>
      </span>

      <span
        v-if="position && swipeable"
        class="mark-preview__position"
      >{{ position.index }} из {{ position.total }}</span>
      <u-icon
        v-else
        class="mark-preview__chevron"
        icon="app:arrow-right"
        width="16"
      />
    </button>
  </teleport>
</template>

<style scoped lang="scss">
:global(.mark-preview) {
  z-index: 3;
  pointer-events: auto;
}

.mark-preview {
  &__card {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(280px, 78vw);
    @include glass-panel(18px, 10px 12px 10px 10px, false);
    background: var(--bg-block-solid, var(--bg-color-block));
    border: 0.5px solid var(--glass-border);
    text-align: left;
    cursor: pointer;
    transform-origin: 50% 100%;
    // Свайп по карточке не должен скроллить страницу; вертикаль оставляем браузеру
    touch-action: pan-y;
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);

    &--from-pop {
      animation: mark-preview-pop 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
    }

    &--from-right {
      animation: mark-preview-from-right 0.26s cubic-bezier(0.22, 1, 0.36, 1);
    }

    &--from-left {
      animation: mark-preview-from-left 0.26s cubic-bezier(0.22, 1, 0.36, 1);
    }

    &--dragging {
      transition: none;
    }

    &--closing {
      pointer-events: none;
      animation: mark-preview-out 0.16s ease-in both;
    }
  }

  &__position {
    flex: 0 0 auto;
    align-self: flex-start;
    @include label-text(11px, none);
    font-variant-numeric: tabular-nums;
    color: var(--text-color-secondary);
  }

  &__media {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    overflow: hidden;
    // Цвета темы, а не категории с сервера — иначе карточка выбивается из оформления
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 14%, var(--bg-color-block));

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__category {
    @include label-text(10px, uppercase);
    letter-spacing: 0.6px;
    color: var(--primary-color);
  }

  &__title {
    @include value-text(14px, var(--text-color), 700);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    @include label-text(12px, none);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__chevron {
    flex: 0 0 auto;
    color: var(--text-color-secondary);
  }
}

@keyframes mark-preview-out {
  to {
    opacity: 0;
    transform: translateY(6px) scale(0.9);
  }
}

@keyframes mark-preview-from-right {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
}

@keyframes mark-preview-from-left {
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
}

@keyframes mark-preview-pop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
