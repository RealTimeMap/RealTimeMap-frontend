<script setup lang="ts">
import type { ShallowRef } from 'vue'
import type { MapPoint } from '@/types/shared/map'
import * as maplibregl from 'maplibre-gl'
import { patchMarkerOpacity } from '@/components/00.shared/lib/patchMarker'

interface Props {
  coordinates: MapPoint
  count: number
}

const props = defineProps<Props>()
const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const marker = shallowRef<maplibregl.Marker | null>(null)

const el = document.createElement('div')
const isReady = ref(false)

onMounted(() => {
  if (!map?.value)
    return

  const instance = new maplibregl.Marker({
    element: el,
    anchor: 'center',
  })

  patchMarkerOpacity(instance)

  instance.setLngLat(props.coordinates).addTo(map.value)
  marker.value = instance
  isReady.value = true
})

watch(() => props.coordinates, (newCoords) => {
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
    <div class="cluster-marker">
      <div class="cluster-body">
        {{ count }}
      </div>
      <div class="pulse-ring ring-1" />
      <div class="pulse-ring ring-2" />
    </div>
  </teleport>
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
  position: relative;
}
.cluster-body {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  background: var(--primary-color);
  border: 2px solid var(--border-subtle);
  border-radius: 50%;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
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
}
.ring-1 {
  animation: pulse 3s infinite;
}
.ring-2 {
  animation: pulse 3s 1.5s infinite;
}
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
</style>
