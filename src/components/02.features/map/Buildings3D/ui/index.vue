<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { isSplashVisible } from '@/components/00.shared/lib/splash'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import {
  BUILDINGS_LAYER_ID,
  buildingsBeforeId,
  buildingsColor,
  createBuildingsLayer,
  DEFAULT_LIGHT,
  SOFT_LIGHT,
  SOURCE_ID,
  SOURCE_LAYER,
} from '../model/useBuildingsLayer'

/** Сколько растёт одно здание и на сколько растянута волна от центра к краям экрана. */
const GROW_DURATION = 700
const WAVE_DURATION = 700

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
    instance.addLayer(createBuildingsLayer(themeBase(resolvedTheme.value)), buildingsBeforeId(instance.getStyle().layers))
    instance.once('idle', () => {
      if (!disposed)
        runWave(instance, buildings)
    })
  })
}

function applyLight(instance: maplibregl.Map, light: maplibregl.LightSpecification) {
  // setLight вызывает styledata — ставим только при отличии, чтобы не зациклиться
  if (JSON.stringify(instance.getLight()) !== JSON.stringify(light))
    instance.setLight(light)
}

function addLayer(instance: maplibregl.Map) {
  const layers = instance.getStyle().layers
  const beforeId = buildingsBeforeId(layers)
  applyLight(instance, SOFT_LIGHT)

  // setStyle с diff сохраняет слой, но слои нового стиля могут оказаться над ним.
  // Двигаем только при неверном порядке: moveLayer сам вызывает styledata
  if (instance.getLayer(BUILDINGS_LAYER_ID)) {
    const own = layers.findIndex(layer => layer.id === BUILDINGS_LAYER_ID)
    const target = beforeId ? layers.findIndex(layer => layer.id === beforeId) : layers.length
    if (own !== target - 1)
      instance.moveLayer(BUILDINGS_LAYER_ID, beforeId)
    return
  }
  revealNewLayer(instance)
}

function removeLayer(instance: maplibregl.Map) {
  if (instance.getLayer(BUILDINGS_LAYER_ID))
    instance.removeLayer(BUILDINGS_LAYER_ID)
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
    instance?.on('styledata', sync)
    sync()
  },
  { immediate: true },
)

// Цвет зданий зависит от темы, а setStyle с diff может слой и сохранить
watch(resolvedTheme, (theme) => {
  const instance = map?.value
  if (instance?.getLayer(BUILDINGS_LAYER_ID))
    instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-color', buildingsColor(themeBase(theme)))
})

onUnmounted(() => {
  disposed = true
  cancelAnimationFrame(riseFrame)
  stopWaitingVisible?.()
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', sync)
  removeLayer(instance)
  instance.removeFeatureState(STATE_TARGET)
  applyLight(instance, DEFAULT_LIGHT)
})
</script>

<template>
  <slot />
</template>
