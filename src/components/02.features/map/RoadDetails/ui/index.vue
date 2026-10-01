<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { MarkingsRequest } from '../model/markings'
import { storeToRefs } from 'pinia'
import { latestWorker, plainFeatures } from '@/components/00.shared/lib/latestWorker'
import { mapNow } from '@/components/00.shared/lib/mapClock'
import { onMapSettled } from '@/components/00.shared/lib/mapIdle'
import { useMapStyleBase } from '@/components/00.shared/lib/mapStyleBase'
import { fixedFoliage, foliageAt } from '@/components/00.shared/lib/season'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useWeatherStore } from '@/components/02.features/map/Weather'
import {
  CARTO_SOURCE,
  createLayers,
  detailsBeforeId,
  MARKING_LAYERS,
  MARKING_ZOOM,
  markingOpacity,
  MARKINGS_SOURCE,
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

// --- Разметка проезжей части считается в воркере по дорогам вокруг экрана ---
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
/** Стилевые слои, по которым берём дороги и тротуары: заливки дорог и мостов, дорожки. */
const QUERY_LAYERS = /^(?:road|bridge)_(?:.*fill.*|path)$/

let markings = EMPTY
const markingsWorker = latestWorker<MarkingsRequest, GeoJSON.FeatureCollection>(
  () => new Worker(new URL('../model/markings.worker.ts', import.meta.url), { type: 'module' }),
)

function setMarkings(instance: maplibregl.Map, data: GeoJSON.FeatureCollection) {
  markings = data
  const source = instance.getSource(MARKINGS_SOURCE) as maplibregl.GeoJSONSource | undefined
  source?.setData(data)
}

function updateMarkings() {
  const instance = map?.value
  if (!instance?.getSource(MARKINGS_SOURCE))
    return
  const zoom = instance.getZoom()
  if (zoom < MARKING_ZOOM) {
    if (markings.features.length)
      setMarkings(instance, EMPTY)
    return
  }
  const layers = instance.getStyle().layers.map(layer => layer.id).filter(id => QUERY_LAYERS.test(id))
  const canvas = instance.getCanvas()
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  // С запасом в полэкрана: при сдвиге карты разметка уже посчитана
  const features = instance.queryRenderedFeatures([[-w / 2, -h / 2], [w * 1.5, h * 1.5]], { layers })
  markingsWorker.request(
    { features: plainFeatures(features), zoom, lat: instance.getCenter().lat },
    data => setMarkings(instance, data),
  )
}

function ensureLayers(instance: maplibregl.Map) {
  if (!instance.getSource(CARTO_SOURCE))
    return
  if (!instance.getSource(MARKINGS_SOURCE))
    instance.addSource(MARKINGS_SOURCE, { type: 'geojson', data: markings })
  if (OWN_LAYERS.every(id => instance.getLayer(id)))
    return
  const before = detailsBeforeId(instance.getStyle().layers)
  for (const layer of createLayers(styleBase.value)) {
    if (!instance.getLayer(layer.id))
      instance.addLayer(layer, before)
  }
  applySnow(instance)
  updateMarkings()
}

function removeLayers(instance: maplibregl.Map) {
  for (const id of OWN_LAYERS) {
    if (instance.getLayer(id))
      instance.removeLayer(id)
  }
  if (instance.getSource(MARKINGS_SOURCE))
    instance.removeSource(MARKINGS_SOURCE)
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

let stopSettled: (() => void) | null = null

watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', sync)
  stopSettled?.()
  instance?.on('styledata', sync)
  stopSettled = instance ? onMapSettled(instance, updateMarkings) : null
  sync()
}, { immediate: true })

onUnmounted(() => {
  markingsWorker.dispose()
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', sync)
  stopSettled?.()
  removeLayers(instance)
})
</script>

<template>
  <slot />
</template>
