<script setup lang="ts">
import type { ShallowRef } from 'vue'
import type { MapPoint } from '@/types/shared/map'
import * as maplibregl from 'maplibre-gl'
import { useCachedImage } from '@/components/00.shared/lib/imageCache'
import { patchMarkerOpacity } from '@/components/00.shared/lib/patchMarker'

interface Props {
  coordinates: MapPoint
  draggable?: boolean
  color?: string
  media?: string | null
  icon?: string
  variant?: 'default' | 'user' | 'personal'
  /** Оставшаяся доля срока метки (0..1) — тонкое кольцо вокруг пина. null — без кольца. */
  lifespan?: number | null
  /** Метка скоро исчезнет — мягкая пульсация. */
  expiring?: boolean
  /** Новая метка (пришла только что) — падает на карту с волной. */
  appear?: boolean
  /** Сколько ещё меток стоит в этой же точке — значок «+N». */
  badge?: number
  /** Смещение веером в пикселях, когда наложенные метки раскрыты. */
  spread?: [number, number] | null
  /** Веер собирается: метка втягивается обратно в точку. */
  collapsing?: boolean
  /** При сборке веера метка исчезает (остаётся только представитель группы). */
  collapseHide?: boolean
}

const {
  coordinates,
  draggable = false,
  color = '#fff',
  media = null,
  icon = 'app:pin',
  variant = 'default',
  lifespan = null,
  expiring = false,
  appear = false,
  badge = 0,
  spread = null,
  collapsing = false,
  collapseHide = false,
} = defineProps<Props>()

const emit = defineEmits<{ click: [] }>()
const RING_RADIUS = 20
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

const spreadStyle = computed(() => {
  if (!spread)
    return undefined
  const [x, y] = spread
  return {
    '--sx': `${x}px`,
    '--sy': `${y}px`,
    '--rot': `${Math.atan2(x, -y)}rad`,
  }
})

const mediaSrc = useCachedImage(() => media)

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const marker = shallowRef<maplibregl.Marker | null>(null)

const photoLoaded = ref(false)

const el = document.createElement('div')
const isReady = ref(false)

onMounted(() => {
  if (!map?.value)
    return

  const instance = new maplibregl.Marker({
    element: el,
    draggable,
    anchor: 'bottom',
  })

  patchMarkerOpacity(instance)

  instance.setLngLat(coordinates).addTo(map.value)
  marker.value = instance
  isReady.value = true
})

watch(() => coordinates, (newCoords) => {
  marker.value?.setLngLat(newCoords)
})

onUnmounted(() => {
  marker.value?.remove()
  marker.value = null
})
</script>

<template>
  <div style="display: none;" />

  <teleport
    v-if="isReady"
    :to="el"
  >
    <span
      v-if="spread && !collapsing"
      class="marker-spread-origin"
    />
    <div
      class="marker-spread"
      :class="{
        'marker-spread--active': !!spread && !collapsing,
        'marker-spread--collapsing': !!spread && collapsing,
        'marker-spread--collapse-hide': !!spread && collapsing && collapseHide,
      }"
      :style="spreadStyle"
    >
      <div
        class="custom-map-marker"
        :class="{
          draggable,
          'custom-map-marker--user': variant === 'user',
          'custom-map-marker--personal': variant === 'personal',
          'custom-map-marker--drop': appear,
          'custom-map-marker--expiring': expiring,
        }"
        @click="emit('click')"
      >
        <svg
          v-if="lifespan !== null"
          class="marker-lifespan"
          viewBox="0 0 44 44"
          aria-hidden="true"
        >
          <circle
            class="marker-lifespan__track"
            cx="22"
            cy="22"
            :r="RING_RADIUS"
          />
          <circle
            class="marker-lifespan__progress"
            cx="22"
            cy="22"
            :r="RING_RADIUS"
            :stroke-dasharray="RING_LENGTH"
            :stroke-dashoffset="RING_LENGTH * (1 - lifespan)"
          />
        </svg>
        <span
          v-if="badge > 0"
          class="marker-badge"
        >+{{ badge }}</span>
        <span
          v-if="appear"
          class="marker-ripple"
        />
        <template v-if="variant === 'personal'">
          <div
            class="marker-personal"
            :style="{ borderColor: color, color }"
          >
            <u-icon
              :icon="icon"
              height="20"
            />
          </div>
        </template>
        <template v-else-if="media || variant === 'user'">
          <div class="marker__block">
            <div
              v-if="media"
              class="marker-photo"
              :style="variant === 'user' ? undefined : { borderColor: color }"
            >
              <img
                :src="mediaSrc"
                class="marker-photo__img"
                :class="{ 'marker-photo__img--loaded': photoLoaded }"
                alt="photo"
                @load="photoLoaded = true"
              >
            </div>
            <div
              v-else
              class="marker-photo marker-photo--placeholder"
            >
              <u-icon
                icon="app:user"
                height="20"
              />
            </div>
          </div>
        </template>
        <div
          v-else
          class="marker-icon"
        />
        <div
          v-if="variant === 'user'"
          class="marker-pulse"
        />
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
/* --- Веер наложенных меток --- */
.marker-spread {
  transform-origin: 50% 100%;
}

.marker-spread--active,
.marker-spread--collapsing {
  .marker-photo__img {
    rotate: calc(var(--rot) * -1);
  }
}

.marker-spread--active {
  transform: translate(var(--sx), var(--sy)) rotate(var(--rot));
  animation: marker-fan 0.28s cubic-bezier(0.34, 1.3, 0.64, 1) both;
}

.marker-spread--collapsing {
  animation: marker-fan-back 0.22s cubic-bezier(0.4, 0, 1, 1) both;
}

.marker-spread--collapse-hide {
  animation-name: marker-fan-back-hide;
}

@keyframes marker-fan-back {
  from {
    transform: translate(var(--sx), var(--sy)) rotate(var(--rot));
  }
  to {
    transform: translate(0, 0) rotate(0);
  }
}

@keyframes marker-fan-back-hide {
  from {
    opacity: 1;
    transform: translate(var(--sx), var(--sy)) rotate(var(--rot)) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(0, 0) rotate(0) scale(0.6);
  }
}

@keyframes marker-fan {
  from {
    transform: translate(0, 0) rotate(0) scale(0.6);
  }
  to {
    transform: translate(var(--sx), var(--sy)) rotate(var(--rot)) scale(1);
  }
}

.marker-spread-origin {
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: var(--primary-color);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary-color) 22%, transparent);
  pointer-events: none;
  animation: marker-origin-in 0.25s ease both;
}

@keyframes marker-origin-in {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
}

/* --- Срок метки --- */
.marker-lifespan {
  position: absolute;
  top: 8px;
  left: 2px;
  width: 44px;
  height: 44px;
  transform: rotate(-90deg);
  pointer-events: none;
  z-index: 3;
  overflow: visible;

  &__track {
    fill: none;
    stroke: color-mix(in srgb, var(--primary-color) 18%, transparent);
    stroke-width: 2.5;
  }

  &__progress {
    fill: none;
    stroke: var(--primary-color);
    stroke-width: 2.5;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.6s ease;
  }
}

.custom-map-marker--expiring .marker-lifespan {
  animation: marker-expiring 1.8s ease-in-out infinite;
}

@keyframes marker-expiring {
  0%,
  100% {
    opacity: 1;
    filter: drop-shadow(0 0 0 transparent);
  }
  50% {
    opacity: 0.45;
    filter: drop-shadow(0 0 4px var(--primary-color));
  }
}

/* --- Несколько меток в одной точке --- */
.marker-badge {
  position: absolute;
  top: 4px;
  right: -2px;
  z-index: 4;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  background: var(--primary-color);
  box-shadow: 0 0 0 2px var(--bg-color-block, #fff);
}

/* --- Новая метка падает на карту --- */
.custom-map-marker.custom-map-marker--drop {
  animation: marker-drop 0.7s cubic-bezier(0.22, 1.4, 0.36, 1) both;
}

@keyframes marker-drop {
  0% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(0) scale(1.05, 0.92);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

.marker-ripple {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 16px;
  height: 6px;
  margin-left: -8px;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  pointer-events: none;
  opacity: 0;
  animation: marker-ripple 1.4s ease-out 0.4s 2;
}

@keyframes marker-ripple {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(6);
  }
}

.custom-map-marker {
  position: relative;
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
}

/* Появление метки — плавный zoom из точки (кроме метки пользователя) */
.custom-map-marker:not(.custom-map-marker--user) {
  transform-origin: bottom center;
  animation: marker-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes marker-in {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.draggable {
  cursor: grab;
}
.marker__block {
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border: 6px solid transparent;
    border-top-color: var(--marker-accent, #3399ff);
    z-index: 1;
  }
}
.marker-photo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--marker-accent, #3399ff);
  box-shadow: rgba(0, 0, 0, 0.5) 0px 6px 14px;
  background-color: white;
  position: relative;
  z-index: 2;
  /* Обрезаем размытие по кругу — блюр не вылезает за метку */
  overflow: hidden;
}

.marker-photo__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* blur-up: до загрузки — размыто (внутри круга) */
  filter: blur(6px);
  transform: scale(1.1);
  opacity: 0.7;
  transition:
    filter 0.4s ease,
    transform 0.4s ease,
    opacity 0.3s ease;

  &--loaded {
    filter: blur(0);
    transform: scale(1);
    opacity: 1;
  }
}
.marker-icon {
  width: 36px;
  height: 36px;
  background: var(--marker-gradient, linear-gradient(145deg, #66ccff, #0066cc));
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}
.marker-pulse {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: var(--marker-pulse, rgba(0, 153, 255, 0.3));
  border-radius: 50%;
}

.marker-photo--placeholder {
  display: grid;
  place-items: center;
  background: #fff;
  color: var(--primary-color);
}

/* Собственная метка пользователя: аватар-пин с акцентным кольцом и пульсом */
.custom-map-marker--user {
  .marker__block::after {
    border-top-color: var(--primary-color);
  }

  .marker-photo {
    border: 3px solid var(--primary-color);
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--primary-color) 20%, transparent),
      rgba(0, 0, 0, 0.4) 0px 4px 12px;
  }

  /* Пульс-ореол по центру аватара */
  .marker-pulse {
    top: 50%;
    left: 50%;
    width: 34px;
    height: 34px;
    background: color-mix(in srgb, var(--primary-color) 38%, transparent);
    transform: translate(-50%, -50%);
    animation: user-pulse 2s ease-out infinite;
  }
}

@keyframes user-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.85);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.marker-personal {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px dashed currentColor;
  background: var(--bg-block-solid, #fff);
  box-shadow: rgba(0, 0, 0, 0.35) 0 4px 12px;

  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border: 6px solid transparent;
    border-top-color: currentColor;
  }
}
</style>
