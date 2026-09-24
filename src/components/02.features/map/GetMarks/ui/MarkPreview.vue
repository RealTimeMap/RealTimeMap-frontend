<script setup lang="ts">
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Mark, MarkFull } from '@/components/00.shared/services/mark/index.type'
import type { MapPoint } from '@/types/shared/map'
import * as maplibregl from 'maplibre-gl'
import { distanceMeters, formatDistance } from '@/components/00.shared/lib/geo'
import { useCachedImage } from '@/components/00.shared/lib/imageCache'
import { markApi } from '@/components/00.shared/services/mark'

const props = defineProps<{
  map: MapLibreMap
  mark: Mark
  userCoordinates: MapPoint | null
}>()

const emit = defineEmits<{
  (e: 'open'): void
}>()

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

onMounted(() => {
  // Marker сам двигает карточку вместе с картой — без пересчёта позиции на каждом кадре
  anchor = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, MARKER_OFFSET_Y] })
    .setLngLat(props.mark.geom.coordinates as MapPoint)
    .addTo(props.map)
  isReady.value = true
})

watch(() => props.mark.geom.coordinates, coordinates => anchor?.setLngLat(coordinates as MapPoint))

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
      type="button"
      :aria-label="`Открыть метку «${mark.markName}»`"
      @click.stop="emit('open')"
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

      <u-icon
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
    animation: mark-preview-pop 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);

    &:active {
      transform: scale(0.97);
    }
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
