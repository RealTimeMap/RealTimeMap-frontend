<script setup lang="ts">
import type { Landmark } from '../model/landmarks'
import type { StoryChapter } from '../model/story'
import type { MapPoint } from '@/types/shared/map'
import { distanceMeters, formatDistance } from '@/components/00.shared/lib/geo'
import { useMarksViewStore } from '@/components/02.features/map/GetMarks'
import { storyOf } from '../model/story'
import CollectibleCard from './CollectibleCard.vue'

const props = defineProps<{
  landmark: Landmark
  number: number
  total: number
  distance: number | null
  openedAt: number | null
  revealing: boolean
  /** Середина модели на экране, px; null — камера в движении. */
  center: { x: number, y: number } | null
  /** Поворот камеры, градусы: факты вращаются вокруг модели вместе с ней. */
  bearing: number
  /** Камера долетела до здания — до этого первая глава стоит на месте. */
  ready: boolean
}>()

const emit = defineEmits<{
  exit: []
  route: []
  chapter: [chapter: StoryChapter]
  openMark: [id: number]
}>()

/** Сколько длится глава, пока её не перелистнули. */
const CHAPTER_MS = 7000
/** Короче — нажатие, дольше — удержание (пауза). */
const HOLD_MS = 250
const TAP_PX = 12
/** Левая часть экрана листает назад, остальное — вперёд. */
const BACK_ZONE = 0.3
const NEARBY_RADIUS = 300
const NEARBY_LIMIT = 3

const view = useMarksViewStore()

// --- Главы ---
const chapters = computed(() => storyOf(props.landmark))
const index = ref(0)
const chapter = computed(() => chapters.value[index.value]!)
const paused = ref(false)

watch(() => props.landmark.id, () => {
  index.value = 0
})
watch(chapter, value => emit('chapter', value), { immediate: true })

function goTo(next: number) {
  index.value = Math.min(chapters.value.length - 1, Math.max(0, next))
}

/** Полоска главы заполнилась — дальше сама, кроме последней: там карточка и метки, её не торопим. */
function onProgressEnd() {
  if (index.value < chapters.value.length - 1)
    goTo(index.value + 1)
}

const nearby = computed(() => view.marks
  .map(mark => ({ mark, distance: distanceMeters(props.landmark.coordinates, mark.geom.coordinates as MapPoint) }))
  .filter(item => item.distance <= NEARBY_RADIUS)
  .sort((a, b) => a.distance - b.distance)
  .slice(0, NEARBY_LIMIT))

// --- Факты по кругу вокруг модели (только в «Знакомстве») ---
// Точка на эллипсе вокруг здания: при повороте камеры круг проворачивается в обратную сторону,
// будто факты висят вокруг здания. Ближние к камере — крупнее и ярче
const facts = computed(() => {
  const list = props.landmark.facts ?? []
  const center = props.center
  if (!center || chapter.value.kind !== 'intro')
    return []
  // Плашка факта около 90 px шириной — круг не выходит за край экрана
  const radiusX = Math.max(60, Math.min(170, Math.min(center.x, window.innerWidth - center.x) - 56))
  const radiusY = 44
  return list.map((fact, factIndex) => {
    const angle = (factIndex / list.length) * Math.PI * 2 - props.bearing * Math.PI / 180
    const near = (Math.cos(angle) + 1) / 2
    return {
      fact,
      style: {
        transform: `translate(${center.x + Math.sin(angle) * radiusX}px, ${center.y + Math.cos(angle) * radiusY}px) translate(-50%, -50%) scale(${0.8 + 0.2 * near})`,
        opacity: 0.3 + 0.7 * near,
        zIndex: near > 0.5 ? 2 : 1,
      },
    }
  })
})

// --- Жесты: нажатие листает главы, удержание — пауза ---
let press: { x: number, y: number, held: boolean } | null = null
let holdTimer: ReturnType<typeof setTimeout> | undefined

function onDown(event: PointerEvent) {
  press = { x: event.clientX, y: event.clientY, held: false }
  holdTimer = setTimeout(() => {
    if (!press)
      return
    press.held = true
    paused.value = true
  }, HOLD_MS)
}

function onUp(event: PointerEvent) {
  clearTimeout(holdTimer)
  if (!press)
    return
  const { held } = press
  const dx = event.clientX - press.x
  const dy = event.clientY - press.y
  press = null
  paused.value = false
  if (held || Math.hypot(dx, dy) > TAP_PX)
    return
  goTo(event.clientX < window.innerWidth * BACK_ZONE ? index.value - 1 : index.value + 1)
}

function onCancel() {
  clearTimeout(holdTimer)
  press = null
  paused.value = false
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape')
    emit('exit')
  else if (event.key === 'ArrowRight')
    goTo(index.value + 1)
  else if (event.key === 'ArrowLeft')
    goTo(index.value - 1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(holdTimer)
})
</script>

<template>
  <teleport to="body">
    <div
      class="cinema"
      :class="{ 'cinema--paused': paused || !ready }"
      role="dialog"
      :aria-label="landmark.title"
    >
      <div class="cinema__tint" />
      <div class="cinema__scrim" />
      <div class="cinema__vignette" />
      <div class="cinema__bar cinema__bar--top" />
      <div class="cinema__bar cinema__bar--bottom" />

      <div
        class="cinema__catcher"
        @pointerdown="onDown"
        @pointerup="onUp"
        @pointercancel="onCancel"
        @pointerleave="onCancel"
      />

      <div class="cinema__top">
        <div class="cinema__progress">
          <span
            v-for="(item, itemIndex) in chapters"
            :key="`${landmark.id}-${itemIndex}`"
            class="cinema__segment"
            :class="{ 'cinema__segment--done': itemIndex < index }"
          >
            <span
              v-if="itemIndex === index"
              :key="`${landmark.id}-${index}-fill`"
              class="cinema__fill"
              :class="{ 'cinema__fill--static': item.kind === 'now' }"
              :style="{ animationDuration: `${CHAPTER_MS}ms` }"
              @animationend="onProgressEnd"
            />
          </span>
        </div>
        <button
          class="cinema__close"
          type="button"
          aria-label="Выйти"
          @click="emit('exit')"
        >
          <u-icon
            icon="app:close"
            width="16"
          />
        </button>
      </div>

      <header
        :key="landmark.id"
        class="cinema__title"
      >
        <span
          v-if="landmark.city"
          class="cinema__city"
        >{{ landmark.city }}</span>
        <h1 class="cinema__name">
          {{ landmark.title }}
        </h1>
      </header>

      <div
        v-for="(item, factIndex) in facts"
        :key="`${landmark.id}-${factIndex}`"
        class="cinema__fact"
        :style="item.style"
      >
        <div
          class="cinema__fact-body"
          :style="{ animationDelay: `${0.4 + factIndex * 0.45}s` }"
        >
          <span class="cinema__fact-value">{{ item.fact.value }}</span>
          <span class="cinema__fact-label">{{ item.fact.label }}</span>
        </div>
      </div>

      <div class="cinema__bottom">
        <transition
          name="cinema-panel"
          mode="out-in"
        >
          <section
            v-if="chapter.kind !== 'now'"
            :key="`${landmark.id}-${index}`"
            class="cinema__panel"
          >
            <span class="cinema__chapter">{{ chapter.title }}</span>
            <p
              v-if="chapter.text"
              class="cinema__text"
            >
              {{ chapter.text }}
            </p>
          </section>

          <section
            v-else
            :key="`${landmark.id}-now`"
            class="cinema__now"
          >
            <div class="cinema__panel">
              <span class="cinema__chapter">Сейчас рядом</span>
              <ul
                v-if="nearby.length"
                class="cinema__marks"
              >
                <li
                  v-for="item in nearby"
                  :key="item.mark.id"
                >
                  <button
                    class="cinema__mark"
                    type="button"
                    @click="emit('openMark', item.mark.id)"
                  >
                    <span class="cinema__dot" />
                    <span class="cinema__mark-title">{{ item.mark.markName }}</span>
                    <span class="cinema__mark-distance">{{ formatDistance(item.distance) }}</span>
                  </button>
                </li>
              </ul>
              <p
                v-else
                class="cinema__text"
              >
                Пока тихо — поставьте первую метку у этого места
              </p>
            </div>
            <collectible-card
              :key="landmark.id"
              :landmark="landmark"
              :number="number"
              :total="total"
              :distance="distance"
              :opened-at="openedAt"
              :revealing="revealing"
              @route="emit('route')"
            />
          </section>
        </transition>
        <span class="cinema__hint">Нажмите справа — дальше, слева — назад</span>
      </div>
    </div>
  </teleport>
</template>

<style lang="scss">
// Кинорежим прячет интерфейс карты: остаётся только сцена
$cinema-hidden: '.bottom-nav, .map-controls, .user-search, .weather, .nearby, .nearby-pill, .route-widget, .maplibregl-marker';

.map-cinema :is(#{$cinema-hidden}) {
  pointer-events: none !important;
  animation: cinema-ui-out 0.35s ease both;
}

.map-cinema-leaving :is(#{$cinema-hidden}) {
  animation: cinema-ui-in 0.5s ease both;
}

@keyframes cinema-ui-out {
  to {
    opacity: 0;
  }
}

@keyframes cinema-ui-in {
  from {
    opacity: 0;
  }
}
</style>

<style scoped lang="scss">
$bar-top: calc(7vh + var(--safe-top, 0px));
$bar-bottom: calc(7vh + var(--safe-bottom, 0px));

.cinema {
  position: fixed;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  color: #fff;

  // Тёплый свет «золотого часа» сверху и затемнение по краям, как в кадре фильма
  &__tint {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgb(255 170 90 / 0.16), transparent 55%);
    mix-blend-mode: soft-light;
    animation: cinema-fade 1.2s ease both;
  }

  // Затемнение под титром и текстом: светлая карта не спорит с буквами
  &__scrim {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, rgb(0 0 0 / 0.6), transparent 32%),
      linear-gradient(to top, rgb(0 0 0 / 0.6), transparent 42%);
    animation: cinema-fade 1s ease both;
  }

  &__vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 45%, transparent 50%, rgb(0 0 0 / 0.45) 100%);
    animation: cinema-fade 1.2s ease both;
  }

  &__bar {
    position: absolute;
    left: 0;
    right: 0;
    background: #000;

    &--top {
      top: 0;
      height: $bar-top;
      animation: cinema-bar-top 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    &--bottom {
      bottom: 0;
      height: $bar-bottom;
      animation: cinema-bar-bottom 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  }

  &__catcher {
    position: absolute;
    inset: 0;
    pointer-events: auto;
    touch-action: none;
  }

  // --- Полоска глав и выход ---
  &__top {
    position: absolute;
    left: 16px;
    right: 16px;
    top: calc(#{$bar-top} + 10px);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: cinema-fade 0.6s ease 0.4s both;
  }

  &__progress {
    flex: 1;
    display: flex;
    gap: 4px;
  }

  &__segment {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    overflow: hidden;
    background: rgb(255 255 255 / 0.3);

    &--done {
      background: #fff;
    }
  }

  &__fill {
    display: block;
    height: 100%;
    background: #f6d77a;
    transform-origin: left center;
    animation: cinema-progress linear both;

    &--static {
      animation: none;
    }
  }

  &--paused &__fill {
    animation-play-state: paused;
  }

  &__close {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    color: #fff;
    background: rgb(255 255 255 / 0.16);
    pointer-events: auto;
    cursor: pointer;
  }

  &__title {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(#{$bar-top} + 36px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 24px;
    text-align: center;
    text-shadow: 0 2px 18px rgb(0 0 0 / 0.55);
    animation: cinema-title 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
  }

  &__city {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #f6d77a;
  }

  &__name {
    margin: 0;
    font-size: clamp(26px, 8vw, 38px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.5px;
  }

  // --- Факты вокруг модели ---
  &__fact {
    position: absolute;
    left: 0;
    top: 0;
    will-change: transform;
  }

  &__fact-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 12px;
    border-radius: 14px;
    background: rgb(12 12 16 / 0.62);
    border: 1px solid rgb(246 215 122 / 0.35);
    white-space: nowrap;
    animation: cinema-fact 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  &__fact-value {
    font-size: 17px;
    font-weight: 800;
    color: #f6d77a;
    font-variant-numeric: tabular-nums;
  }

  &__fact-label {
    font-size: 10px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    opacity: 0.8;
  }

  // --- Низ: текст главы или «Сейчас рядом» ---
  &__bottom {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: calc(#{$bar-bottom} + 12px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  &__panel {
    width: min(420px, 100%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 18px;
    background: rgb(12 12 16 / 0.72);
    border: 1px solid rgb(255 255 255 / 0.08);
    pointer-events: auto;
  }

  &__now {
    width: min(420px, 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  &__chapter {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: #f6d77a;
  }

  &__text {
    margin: 0;
    font-size: 15px;
    line-height: 1.45;
    color: rgb(255 255 255 / 0.92);
  }

  &__marks {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  &__mark {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 2px;
    border: none;
    background: none;
    color: #fff;
    text-align: left;
    cursor: pointer;
  }

  &__dot {
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f6d77a;
  }

  &__mark-title {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__mark-distance {
    flex: 0 0 auto;
    font-size: 12px;
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }

  &__hint {
    font-size: 11px;
    opacity: 0.7;
    text-shadow: 0 1px 6px rgb(0 0 0 / 0.6);
    animation:
      cinema-fade 0.6s ease 1.5s both,
      cinema-hint-out 0.8s ease 6s forwards;
  }
}

.cinema-panel-enter-active,
.cinema-panel-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.cinema-panel-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.cinema-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes cinema-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes cinema-fade {
  from {
    opacity: 0;
  }
}

@keyframes cinema-bar-top {
  from {
    transform: translateY(-100%);
  }
}

@keyframes cinema-bar-bottom {
  from {
    transform: translateY(100%);
  }
}

@keyframes cinema-title {
  from {
    opacity: 0;
    transform: translateY(12px);
    letter-spacing: 2px;
  }
}

@keyframes cinema-fact {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes cinema-hint-out {
  to {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cinema *:not(.cinema__fill) {
    animation-duration: 0.01s !important;
  }
}
</style>
