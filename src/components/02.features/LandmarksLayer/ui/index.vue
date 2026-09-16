<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { DEMO_LANDMARKS } from '../model/landmarks'
import { createLandmarksLayer, LAYER_ID } from '../model/useThreeLandmarks'

const map = inject<ShallowRef<maplibregl.Map | null>>('map')

function addLayer(instance: maplibregl.Map) {
  if (instance.getLayer(LAYER_ID))
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
    if (instance.isStyleLoaded())
      addLayer(instance)
    else
      instance.once('style.load', () => addLayer(instance))
  },
  { immediate: true },
)

onUnmounted(() => {
  if (map?.value)
    removeLayer(map.value)
})
</script>

<template>
  <slot />
</template>
