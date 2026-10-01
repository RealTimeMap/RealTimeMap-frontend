<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { useMapStyleBase } from '@/components/00.shared/lib/mapStyleBase'
import {
  CARTO_SOURCE,
  drawPaving,
  groundBeforeId,
  groundLayers,
  OWN_LAYERS,
  paintColors,
  PAVING_IMAGE,
  PIXEL_RATIO,
  sleepersBeforeId,
  sleepersLayer,
} from '../model/cityDetails'

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const styleBase = useMapStyleBase()

/** Плитка по теме: на тёмной карте камень темнее. */
function images(): Array<[id: string, image: ImageData]> {
  return [[PAVING_IMAGE, drawPaving(styleBase.value)]]
}

function ensureLayers(instance: maplibregl.Map) {
  if (!instance.getSource(CARTO_SOURCE) || OWN_LAYERS.every(id => instance.getLayer(id)))
    return
  for (const [id, image] of images()) {
    if (!instance.hasImage(id))
      instance.addImage(id, image, { pixelRatio: PIXEL_RATIO })
  }
  const layers = instance.getStyle().layers
  const ground = groundBeforeId(layers)
  for (const layer of groundLayers(styleBase.value)) {
    if (!instance.getLayer(layer.id))
      instance.addLayer(layer, ground)
  }
  const rail = sleepersBeforeId(layers)
  const sleepers = sleepersLayer(styleBase.value)
  if (rail && !instance.getLayer(sleepers.id))
    instance.addLayer(sleepers, rail)
}

function removeLayers(instance: maplibregl.Map) {
  for (const id of OWN_LAYERS) {
    if (instance.getLayer(id))
      instance.removeLayer(id)
  }
  for (const [id] of images()) {
    if (instance.hasImage(id))
      instance.removeImage(id)
  }
}

let waitingForIdle = false

function sync() {
  const instance = map?.value
  if (!instance)
    return
  // isStyleLoaded() ложно и пока грузятся тайлы — дожидаемся idle, а не теряем вызов
  if (!instance.isStyleLoaded()) {
    if (!waitingForIdle) {
      waitingForIdle = true
      instance.once('idle', () => {
        waitingForIdle = false
        sync()
      })
    }
    return
  }
  ensureLayers(instance)
}

watch(styleBase, (base) => {
  const instance = map?.value
  if (!instance)
    return
  for (const [id, property, value] of paintColors(base)) {
    if (instance.getLayer(id))
      instance.setPaintProperty(id, property, value)
  }
  for (const [id, image] of images()) {
    if (instance.hasImage(id))
      instance.updateImage(id, image)
  }
})

watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', sync)
  instance?.on('styledata', sync)
  sync()
}, { immediate: true })

onUnmounted(() => {
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', sync)
  removeLayers(instance)
})
</script>

<template>
  <slot />
</template>
