<script setup lang="ts">
import type { ShallowRef } from 'vue'
import type { MapPoint } from '@/types/shared/map'
import * as maplibregl from 'maplibre-gl'
import { patchMarkerOpacity } from '@/components/00.shared/lib/patchMarker'

interface Props {
  coordinates: MapPoint
  draggable?: boolean
  color?: string
  media?: string | null
  variant?: 'default' | 'user'
}

const {
  coordinates,
  draggable = false,
  color = '#fff',
  media = null,
  variant = 'default',
} = defineProps<Props>()

const emit = defineEmits<{ click: [] }>()

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const marker = shallowRef<maplibregl.Marker | null>(null)

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
    <div
      class="custom-map-marker"
      :class="{ draggable, 'custom-map-marker--user': variant === 'user' }"
      @click="emit('click')"
    >
      <template v-if="media || variant === 'user'">
        <div class="marker__block">
          <img
            v-if="media"
            :src="media"
            class="marker-photo"
            :style="variant === 'user' ? undefined : { borderColor: color }"
            alt="photo"
          >
          <div
            v-else
            class="marker-photo marker-photo--placeholder"
          >
            <u-icon
              icon="solar:user-bold"
              height="20"
            />
          </div>
        </div>
      </template>
      <div
        v-else
        class="marker-icon"
      />
      <div class="marker-pulse" />
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.custom-map-marker {
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
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
  object-fit: cover;
  border: 1px solid var(--marker-accent, #3399ff);
  box-shadow: rgba(0, 0, 0, 0.5) 0px 6px 14px;
  background-color: white;
  position: relative;
  z-index: 2;
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
  animation: pulse 2s infinite;
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
@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
</style>
