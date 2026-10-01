<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { mapNow } from '@/components/00.shared/lib/mapClock'
import { useMapStyleBase } from '@/components/00.shared/lib/mapStyleBase'
import { fixedFoliage, foliageAt } from '@/components/00.shared/lib/season'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useWeatherStore } from '@/components/02.features/map/Weather'
import {
  CARTO_SOURCE,
  createLayers,
  detailsBeforeId,
  MARKING_LAYERS,
  markingOpacity,
  OWN_LAYERS,
  paintColors,
} from '../model/roadDetails'

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { mapSeason } = storeToRefs(useSettingsStore())
const styleBase = useMapStyleBase()
const weatherStore = useWeatherStore()

function currentSnow(instance: maplibregl.Map): number {
  const mode = mapSeason.value
  if (mode === 'auto')
    return foliageAt(mapNow(), instance.getCenter().lat, weatherStore.snowDepth).snow
  return mode === 'off' ? 0 : fixedFoliage(mode).snow
}

function applySnow(instance: maplibregl.Map) {
  const opacity = markingOpacity(currentSnow(instance))
  for (const id of MARKING_LAYERS) {
    if (instance.getLayer(id) && instance.getPaintProperty(id, 'line-opacity') !== opacity)
      instance.setPaintProperty(id, 'line-opacity', opacity)
  }
}

function ensureLayers(instance: maplibregl.Map) {
  if (!instance.getSource(CARTO_SOURCE))
    return
  if (OWN_LAYERS.every(id => instance.getLayer(id)))
    return
  const before = detailsBeforeId(instance.getStyle().layers)
  for (const layer of createLayers(styleBase.value)) {
    if (!instance.getLayer(layer.id))
      instance.addLayer(layer, before)
  }
  applySnow(instance)
}

function removeLayers(instance: maplibregl.Map) {
  for (const id of OWN_LAYERS) {
    if (instance.getLayer(id))
      instance.removeLayer(id)
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
  for (const [id, property, color] of paintColors(base)) {
    if (instance.getLayer(id))
      instance.setPaintProperty(id, property, color)
  }
})

watch([mapSeason, () => weatherStore.snowDepth], () => {
  const instance = map?.value
  if (instance)
    applySnow(instance)
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
