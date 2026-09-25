<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { SunPosition } from '@/components/00.shared/lib/sun'
import { storeToRefs } from 'pinia'
import { isSplashVisible } from '@/components/00.shared/lib/splash'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import {
  BUILDINGS_LAYER_ID,
  buildingsBeforeId,
  buildingsColor,
  buildShadows,
  createBuildingsLayer,
  createShadowLayer,
  createSunlitLayer,
  DEFAULT_LIGHT,
  isNight,
  SHADOW_LAYER_ID,
  SHADOW_SOURCE_ID,
  shadowColor,
  shadowOpacity,
  SOURCE_ID,
  SOURCE_LAYER,
  sunLight,
  SUNLIT_AREA,
  SUNLIT_LAYER_ID,
  SUNLIT_SOURCE_ID,
  sunlitOpacity,
  sunPosition,
} from '../model/useBuildingsLayer'

/** Сколько растёт одно здание и на сколько растянута волна от центра к краям экрана. */
const GROW_DURATION = 700
const WAVE_DURATION = 700
const SUN_UPDATE_MS = 5 * 60_000

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { resolvedTheme } = storeToRefs(useSettingsStore())

let riseFrame = 0
let disposed = false
let stopWaitingVisible: (() => void) | null = null

/** При запуске карту закрывает сплэш — волна под ним прошла бы незаметно. */
function whenMapVisible(run: () => void) {
  stopWaitingVisible?.()
  if (!isSplashVisible.value) {
    run()
    return
  }
  stopWaitingVisible = watch(isSplashVisible, (visible) => {
    if (visible)
      return
    stopWaitingVisible?.()
    stopWaitingVisible = null
    run()
  })
}

interface RisingBuilding {
  id: string | number
  delay: number
  rise: number
}

const STATE_TARGET = { source: SOURCE_ID, sourceLayer: SOURCE_LAYER }

function firstCoordinate(geometry: GeoJSON.Geometry): [number, number] | null {
  if (geometry.type === 'Polygon')
    return geometry.coordinates[0]?.[0] as [number, number] ?? null
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates[0]?.[0]?.[0] as [number, number] ?? null
  return null
}

/** Здания в кадре с задержкой по расстоянию от центра экрана — волна расходится от центра. */
function buildingsInView(instance: maplibregl.Map): RisingBuilding[] {
  const bounds = instance.getBounds()
  const canvas = instance.getCanvas()
  const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }
  const maxDistance = Math.hypot(center.x, center.y) || 1
  const seen = new Map<string | number, RisingBuilding>()

  for (const feature of instance.querySourceFeatures(SOURCE_ID, { sourceLayer: SOURCE_LAYER })) {
    if (feature.id == null || seen.has(feature.id))
      continue
    const coordinate = firstCoordinate(feature.geometry)
    if (!coordinate || !bounds.contains(coordinate))
      continue
    const point = instance.project(coordinate)
    const distance = Math.min(Math.hypot(point.x - center.x, point.y - center.y) / maxDistance, 1)
    seen.set(feature.id, { id: feature.id, delay: distance * WAVE_DURATION, rise: 0 })
  }
  return [...seen.values()]
}

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3

/** Волна: меняется только feature-state — тайлы не перезагружаются, в отличие от setPaintProperty. */
function runWave(instance: maplibregl.Map, buildings: RisingBuilding[]) {
  cancelAnimationFrame(riseFrame)
  const start = performance.now()
  const step = (now: number) => {
    if (disposed || !instance.getLayer(BUILDINGS_LAYER_ID))
      return
    const elapsed = now - start
    let done = true
    for (const building of buildings) {
      const local = Math.min(Math.max((elapsed - building.delay) / GROW_DURATION, 0), 1)
      if (local < 1)
        done = false
      const rise = easeOutCubic(local)
      if (rise !== building.rise) {
        building.rise = rise
        instance.setFeatureState({ ...STATE_TARGET, id: building.id }, { rise })
      }
    }
    if (done) {
      // Без состояния действует значение по умолчанию — полная высота
      instance.removeFeatureState(STATE_TARGET)
      return
    }
    riseFrame = requestAnimationFrame(step)
  }
  riseFrame = requestAnimationFrame(step)
}

let revealPending = false

/**
 * Здания в кадре берутся из уже загруженных тайлов источника и кладутся плоско (rise = 0)
 * ещё до добавления слоя — он сразу появляется плоским, без вспышки полной высоты.
 */
function revealNewLayer(instance: maplibregl.Map) {
  if (revealPending)
    return
  revealPending = true
  whenMapVisible(() => {
    revealPending = false
    if (disposed || instance.getLayer(BUILDINGS_LAYER_ID))
      return
    const buildings = buildingsInView(instance)
    for (const building of buildings)
      instance.setFeatureState({ ...STATE_TARGET, id: building.id }, { rise: 0 })
    instance.addLayer(createBuildingsLayer(themeBase(resolvedTheme.value), isNight(currentSun(instance).position)), buildingsBeforeId(instance.getStyle().layers))
    addShadowLayer(instance)
    instance.once('idle', () => {
      if (disposed)
        return
      runWave(instance, buildings)
      updateShadows(instance)
      applyShadowOpacity(instance)
    })
  })
}

function applyLight(instance: maplibregl.Map, light: maplibregl.LightSpecification) {
  // setLight вызывает styledata — ставим только при отличии, чтобы не зациклиться
  if (JSON.stringify(instance.getLight()) !== JSON.stringify(light))
    instance.setLight(light)
}

// Солнце считается по таймеру, а не при каждом styledata: setLight сам вызывает styledata,
// и со свежим временем значение каждый раз немного другое — получился бы бесконечный цикл
let sun: { position: SunPosition, lat: number } | null = null

function currentSun(instance: maplibregl.Map) {
  if (!sun) {
    const { lng, lat } = instance.getCenter()
    sun = { position: sunPosition(new Date(), lng, lat), lat }
  }
  return sun
}

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

function addShadowLayer(instance: maplibregl.Map) {
  if (!instance.getSource(SHADOW_SOURCE_ID))
    instance.addSource(SHADOW_SOURCE_ID, { type: 'geojson', data: EMPTY })
  if (!instance.getLayer(SHADOW_LAYER_ID))
    instance.addLayer(createShadowLayer(themeBase(resolvedTheme.value)), BUILDINGS_LAYER_ID)
  if (!instance.getSource(SUNLIT_SOURCE_ID))
    instance.addSource(SUNLIT_SOURCE_ID, { type: 'geojson', data: SUNLIT_AREA })
  if (!instance.getLayer(SUNLIT_LAYER_ID))
    instance.addLayer(createSunlitLayer(), SHADOW_LAYER_ID)
}

// Тени пересчитываются, когда карта остановилась и тайлы догрузились, — и только если что-то поменялось
let shadowsKey = ''

function updateShadows(instance: maplibregl.Map) {
  const source = instance.getSource<maplibregl.GeoJSONSource>(SHADOW_SOURCE_ID)
  if (!source || !instance.getLayer(BUILDINGS_LAYER_ID))
    return
  const { position, lat } = currentSun(instance)
  const key = `${instance.getBounds().toArray().flat().map(v => v.toFixed(5))}|${position.azimuth}|${instance.getZoom().toFixed(2)}`
  if (key === shadowsKey)
    return
  shadowsKey = key
  const features = instance.querySourceFeatures(SOURCE_ID, { sourceLayer: SOURCE_LAYER })
  source.setData(buildShadows(features, position, lat))
}

function onIdle() {
  const instance = map?.value
  if (instance && !disposed)
    updateShadows(instance)
}

/** Тени проявляются вместе с волной зданий, а не раньше неё. */
function applyShadowOpacity(instance: maplibregl.Map) {
  if (!instance.getLayer(SHADOW_LAYER_ID) || !instance.getLayer(SUNLIT_LAYER_ID))
    return
  const base = themeBase(resolvedTheme.value)
  const { position } = currentSun(instance)
  const transition = { duration: GROW_DURATION + WAVE_DURATION, delay: 0 }
  instance.setPaintProperty(SHADOW_LAYER_ID, 'fill-extrusion-opacity-transition', transition)
  instance.setPaintProperty(SHADOW_LAYER_ID, 'fill-extrusion-opacity', shadowOpacity(base, position))
  instance.setPaintProperty(SUNLIT_LAYER_ID, 'fill-opacity-transition', transition)
  instance.setPaintProperty(SUNLIT_LAYER_ID, 'fill-opacity', sunlitOpacity(base, position))
}

const sunTimer = setInterval(() => {
  const instance = map?.value
  if (!instance || disposed || !instance.getLayer(BUILDINGS_LAYER_ID))
    return
  const wasNight = isNight(currentSun(instance).position)
  sun = null
  const { position } = currentSun(instance)
  if (isNight(position) !== wasNight)
    instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-color', buildingsColor(themeBase(resolvedTheme.value), isNight(position)))
  applyLight(instance, sunLight(position))
  updateShadows(instance)
  applyShadowOpacity(instance)
}, SUN_UPDATE_MS)

/** Порядок: подсветка земли, тени, здания — сразу перед beforeId. */
const OWN_ORDER = [SUNLIT_LAYER_ID, SHADOW_LAYER_ID, BUILDINGS_LAYER_ID]

function addLayer(instance: maplibregl.Map) {
  applyLight(instance, sunLight(currentSun(instance).position))

  // setStyle с diff сохраняет слои, но слои нового стиля могут оказаться над ними.
  // Двигаем только при неверном порядке: moveLayer сам вызывает styledata
  if (instance.getLayer(BUILDINGS_LAYER_ID)) {
    addShadowLayer(instance)
    const ids = instance.getStyle().layers.map(layer => layer.id)
    const beforeId = buildingsBeforeId(instance.getStyle().layers)
    const target = beforeId ? ids.indexOf(beforeId) : ids.length
    if (ids.slice(target - OWN_ORDER.length, target).join() !== OWN_ORDER.join()) {
      for (const id of OWN_ORDER)
        instance.moveLayer(id, beforeId)
    }
    return
  }
  revealNewLayer(instance)
}

function removeLayer(instance: maplibregl.Map) {
  for (const id of OWN_ORDER) {
    if (instance.getLayer(id))
      instance.removeLayer(id)
  }
  for (const id of [SHADOW_SOURCE_ID, SUNLIT_SOURCE_ID]) {
    if (instance.getSource(id))
      instance.removeSource(id)
  }
}

let waitingForIdle = false

function sync() {
  const instance = map?.value
  if (!instance || disposed)
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
  addLayer(instance)
}

// Смена темы (setStyle с diff) даёт только styledata, style.load не приходит
watch(
  () => map?.value,
  (instance, previous) => {
    previous?.off('styledata', sync)
    previous?.off('idle', onIdle)
    instance?.on('styledata', sync)
    instance?.on('idle', onIdle)
    sync()
  },
  { immediate: true },
)

// Цвет зданий зависит от темы, а setStyle с diff может слой и сохранить
watch(resolvedTheme, (theme) => {
  const instance = map?.value
  if (!instance?.getLayer(BUILDINGS_LAYER_ID))
    return
  const base = themeBase(theme)
  instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-color', buildingsColor(base, isNight(currentSun(instance).position)))
  if (instance.getLayer(SHADOW_LAYER_ID))
    instance.setPaintProperty(SHADOW_LAYER_ID, 'fill-extrusion-color', shadowColor(base))
  applyShadowOpacity(instance)
})

onUnmounted(() => {
  disposed = true
  clearInterval(sunTimer)
  cancelAnimationFrame(riseFrame)
  stopWaitingVisible?.()
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', sync)
  instance.off('idle', onIdle)
  removeLayer(instance)
  instance.removeFeatureState(STATE_TARGET)
  applyLight(instance, DEFAULT_LIGHT)
})
</script>

<template>
  <slot />
</template>
