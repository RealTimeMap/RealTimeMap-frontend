<script setup lang="ts">
import type { MapPoint } from '@/types/shared/map'
import maplibregl from 'maplibre-gl'

interface Props {
  coordinates: MapPoint
  count: number
}

const props = defineProps<Props>()
const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const clusterElement = ref<HTMLElement | null>(null)
const marker = shallowRef<maplibregl.Marker | null>(null)

onMounted(() => {
  if (!map?.value || !clusterElement.value)
    return

  marker.value = new maplibregl.Marker({
    element: clusterElement.value,
    anchor: 'center',
  })
    .setLngLat(props.coordinates)
    .addTo(map.value)
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
    ref="clusterElement"
    class="cluster-marker"
  >
    <div class="cluster-body">
      {{ count }}
    </div>

    <div class="pulse-ring ring-1" />
    <div class="pulse-ring ring-2" />
  </div>
</template>

<style scoped lang="scss">
.cluster-marker {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
}

.cluster-body {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;

  background: var(--primary-color);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;

  color: white;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.pulse-ring {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #3399ff6e;
  border-radius: 50%;
  opacity: 0;
}

.ring-1 {
  animation: pulse 3s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

.ring-2 {
  animation: pulse 3s cubic-bezier(0.455, 0.03, 0.515, 0.955) 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.cluster-marker:hover .cluster-body {
  filter: brightness(1.1);
  transition: filter 0.2s;
}
</style>
