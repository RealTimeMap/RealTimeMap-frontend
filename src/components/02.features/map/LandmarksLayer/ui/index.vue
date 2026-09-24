<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { DEMO_LANDMARKS, LAYER_ID } from '../model/landmarks'

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
let disposed = false

async function addLayer(instance: maplibregl.Map) {
  if (instance.getLayer(LAYER_ID))
    return

  const { createLandmarksLayer } = await import('../model/useThreeLandmarks')
  if (disposed || instance.getLayer(LAYER_ID))
    return

  instance.addLayer(createLandmarksLayer(DEMO_LANDMARKS))
  instance.triggerRepaint()
}

function removeLayer(instance: maplibregl.Map) {
  if (instance.getLayer(LAYER_ID))
    instance.removeLayer(LAYER_ID)
}

watch(
  () => map?.value,
  (instance) => {
    if (!instance)
      return
    if (instance.loaded())
      void addLayer(instance)
    else
      instance.once('idle', () => void addLayer(instance))
  },
  { immediate: true },
)

onUnmounted(() => {
  disposed = true
  if (map?.value)
    removeLayer(map.value)
})
</script>

<template>
  <slot />
</template>
