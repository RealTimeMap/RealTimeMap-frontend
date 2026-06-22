<script setup lang="ts">
import type { MapPoint } from '@/types/shared/map'
import maplibregl from 'maplibre-gl'

interface Props {
  coordinates: MapPoint
  draggable?: boolean
  settings?: object
  color?: string
  media?: string | null
}

interface MarkerEmits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  draggable: false,
  settings: () => ({}),
  color: '#fff',
  media: null,
})

const emit = defineEmits<MarkerEmits>()
const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const markerElement = ref<HTMLElement | null>(null)
const marker = shallowRef<maplibregl.Marker | null>(null)

onMounted(() => {
  if (!map?.value || !markerElement.value)
    return

  marker.value = new maplibregl.Marker({
    element: markerElement.value,
    draggable: props.draggable,
    anchor: 'bottom',
  })
    .setLngLat(props.coordinates)
    .addTo(map.value)

  markerElement.value.addEventListener('click', () => emit('click'))
})

watch(() => props.coordinates, (newCoords) => {
  marker.value?.setLngLat(newCoords)
})

onUnmounted(() => {
  if (marker.value && map?.value) {
    marker.value.remove()
  }
  marker.value = null
})
</script>

<template>
  <div
    ref="markerElement"
    class="custom-map-marker"
    :class="{ draggable: props.draggable }"
  >
    <template v-if="props?.media">
      <div class="marker__block">
        <img
          :src="props.media"
          class="marker-photo"
          :style="{ borderColor: props.color }"
          alt="photo"
        >
      </div>
    </template>

    <template v-else>
      <div class="marker-icon" />
    </template>

    <div class="marker-pulse" />
  </div>
</template>

<style scoped lang="scss">
.custom-map-marker {
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
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
    border-top-color: #3399ff;
    z-index: 1;
  }
}

.marker-photo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #3399ff;
  box-shadow:
    rgba(0, 0, 0, 0.5) 0px 6px 14px,
    rgba(255, 255, 255, 0.3) 0px 1px 0px inset;
  background-color: white;
  position: relative;
  z-index: 2;
}

.marker-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(145deg, #66ccff, #0066cc);
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  position: relative;
  top: 5px;
  animation: pop-in 0.3s ease;
}

.marker-pulse {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: rgba(0, 153, 255, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite;
  z-index: 0;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

@keyframes pop-in {
  0% {
    transform: scale(0.5) rotate(-45deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(-45deg);
    opacity: 1;
  }
}

.custom-map-marker:active {
  cursor: grabbing;
}
</style>
