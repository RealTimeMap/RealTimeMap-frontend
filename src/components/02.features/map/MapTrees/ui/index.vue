<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { ViewBounds } from '../model/trees'
import type { SeasonBlend } from '@/components/00.shared/lib/season'
import { storeToRefs } from 'pinia'
import { fixedSeason, seasonAt } from '@/components/00.shared/lib/season'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { plantTrees, treeColor } from '../model/trees'

const SOURCE_ID = 'map-trees'
const LAYER_ID = 'map-trees'
/** Векторный источник CARTO и слой с лесами и газонами. */
const CARTO_SOURCE = 'carto'
const LANDCOVER_LAYER = 'landcover'
/** Раньше крона меньше пикселя. К FULL_ZOOM деревья дорастают до полной высоты. */
const MIN_ZOOM = 15
const FULL_ZOOM = 15.5
/** Под 3D-зданиями, если они есть, — иначе под подписями. */
const BUILDINGS_LAYER_ID = '3d-buildings'
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
const EARTH_CIRCUMFERENCE = 40_075_016.686
/** Радиус посадки — в размерах экрана вокруг центра карты: с запасом, чтобы при небольшом сдвиге не пересаживать. */
const PLANT_RADIUS_SCREENS = 0.9
/** Центр посадки привязан к сетке с таким шагом (в долях радиуса) — небольшие сдвиги карты не вызывают пересчёта. */
const PLANT_SNAP = 0.25

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { mapSeason, resolvedTheme } = storeToRefs(useSettingsStore())

function season(instance: maplibregl.Map): SeasonBlend {
  if (mapSeason.value === 'auto')
    return seasonAt(new Date(), instance.getCenter().lat)
  return fixedSeason(mapSeason.value === 'off' ? 'summer' : mapSeason.value)
}

function color(instance: maplibregl.Map) {
  return treeColor(themeBase(resolvedTheme.value), season(instance))
}

function beforeId(instance: maplibregl.Map): string | undefined {
  if (instance.getLayer(BUILDINGS_LAYER_ID))
    return BUILDINGS_LAYER_ID
  return instance.getStyle().layers.find(layer => layer.type === 'symbol')?.id
}

function ensureLayer(instance: maplibregl.Map) {
  if (!instance.getSource(SOURCE_ID))
    instance.addSource(SOURCE_ID, { type: 'geojson', data: EMPTY })
  if (instance.getLayer(LAYER_ID))
    return
  instance.addLayer({
    id: LAYER_ID,
    type: 'fill-extrusion',
    source: SOURCE_ID,
    minzoom: MIN_ZOOM,
    paint: {
      'fill-extrusion-color': color(instance),
      // Деревья вырастают вместе с приближением, как и здания; основание растёт вместе с высотой
      'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], MIN_ZOOM, 0, FULL_ZOOM, ['get', 'base']],
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], MIN_ZOOM, 0, FULL_ZOOM, ['get', 'height']],
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': true,
    },
  }, beforeId(instance))
}

// --- Расстановка: когда карта остановилась, и только если вид изменился ---

/**
 * Где сажать: квадрат вокруг центра карты размером примерно в экран.
 * При наклоне видимая область тянется до горизонта — без ограничения весь лимит деревьев
 * уходил бы на далёкие парки, где они меньше пикселя, а рядом не оставалось бы ни одного.
 * Размер и центр округлены, чтобы при небольших сдвигах и зуме квадрат не менялся.
 */
function plantingArea(instance: maplibregl.Map): ViewBounds {
  const { lng, lat } = instance.getCenter()
  const canvas = instance.getCanvas()
  const zoom = Math.floor(instance.getZoom() * 2) / 2
  const metersPerPixel = EARTH_CIRCUMFERENCE * Math.cos(lat * Math.PI / 180) / (512 * 2 ** zoom)
  const radius = Math.max(canvas.clientWidth, canvas.clientHeight) * PLANT_RADIUS_SCREENS * metersPerPixel
  const dLat = radius / 110_540
  const dLng = radius / (111_320 * Math.cos(lat * Math.PI / 180))
  const snap = (value: number, size: number) => Math.round(value / (size * PLANT_SNAP)) * size * PLANT_SNAP
  const centerLng = snap(lng, dLng)
  const centerLat = snap(lat, dLat)
  return { west: centerLng - dLng, south: centerLat - dLat, east: centerLng + dLng, north: centerLat + dLat }
}

let plantedKey = ''

function replant() {
  const instance = map?.value
  const source = instance?.getSource<maplibregl.GeoJSONSource>(SOURCE_ID)
  if (!instance || !source)
    return
  if (instance.getZoom() < MIN_ZOOM) {
    if (plantedKey) {
      plantedKey = ''
      source.setData(EMPTY)
    }
    return
  }
  const area = plantingArea(instance)
  const features = instance.querySourceFeatures(CARTO_SOURCE, { sourceLayer: LANDCOVER_LAYER })
    .filter(feature => feature.properties.class === 'wood' || feature.properties.class === 'grass')
  // Число зелёных зон в ключе: тайлы догружаются после остановки карты, и тогда деревья нужно досадить
  const key = [...Object.values(area).map(v => v.toFixed(5)), features.length].join()
  if (key === plantedKey)
    return
  plantedKey = key
  source.setData(plantTrees(features, area))
}

// --- Стиль: слой возвращается после смены темы, цвет — по сезону и теме ---
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
  const hadSource = !!instance.getSource(SOURCE_ID)
  ensureLayer(instance)
  if (!hadSource) {
    plantedKey = ''
    replant()
  }
}

function recolor() {
  const instance = map?.value
  if (instance?.getLayer(LAYER_ID))
    instance.setPaintProperty(LAYER_ID, 'fill-extrusion-color', color(instance))
}

watch([mapSeason, resolvedTheme], recolor)
// Сезон в режиме «Авто» меняется медленно — раз в час достаточно
const timer = setInterval(recolor, 60 * 60_000)

watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', sync)
  previous?.off('idle', replant)
  instance?.on('styledata', sync)
  instance?.on('idle', replant)
  sync()
}, { immediate: true })

onUnmounted(() => {
  clearInterval(timer)
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', sync)
  instance.off('idle', replant)
  if (instance.getLayer(LAYER_ID))
    instance.removeLayer(LAYER_ID)
  if (instance.getSource(SOURCE_ID))
    instance.removeSource(SOURCE_ID)
})
</script>

<template>
  <slot />
</template>
