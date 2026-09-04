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
    <div
      class="cluster-marker"
      @click="emit('click')"
    >
      <div class="cluster-body">
        {{ count }}
      </div>
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
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.9);
  }
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
  /* Статичный мягкий ореол вместо бесконечной пульсации */
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary-color) 22%, transparent);
}
</style>
