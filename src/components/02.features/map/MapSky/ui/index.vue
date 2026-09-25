<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { sunPosition } from '@/components/00.shared/lib/sun'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { overcast, useWeatherStore } from '@/components/02.features/map/Weather'
import { skyFor } from '../model/skyColors'

const SKY_UPDATE_MS = 5 * 60_000

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { resolvedTheme } = storeToRefs(useSettingsStore())
const weatherStore = useWeatherStore()

// Небо считается по таймеру и теме, а на styledata только возвращается: setSky сам вызывает styledata
let sky: maplibregl.SkySpecification | null = null
/** Небо, каким его вернула карта после нашего setSky, — сравниваем с ним, а не со своим объектом. */
let applied = ''

function compute(instance: maplibregl.Map) {
  const { lng, lat } = instance.getCenter()
  sky = skyFor(themeBase(resolvedTheme.value), sunPosition(new Date(), lng, lat), overcast(weatherStore.weather))
  updateHaze()
}

// --- Дымка у горизонта ---
// Туман MapLibre работает только с рельефом, поэтому дымку рисуем сами: градиент поверх карты
// на линии горизонта — дальние кварталы растворяются в небе, а не обрываются резкой чертой.
// Элемент стоит сразу за canvas, поэтому метки остаются поверх дымки

/** Дальняя точка впереди камеры: её проекция на экран почти совпадает с линией горизонта. */
const FAR_METERS = 2_000_000
/** Насколько глубоко дымка заходит на землю — доля расстояния от горизонта до низа экрана. */
const HAZE_DEPTH = 0.3
const HAZE_ABOVE_PX = 24

const haze = document.createElement('div')
haze.className = 'map-haze'
let hazeFrame = 0

function horizonY(instance: maplibregl.Map): number | null {
  const center = instance.getCenter()
  const bearing = instance.getBearing() * Math.PI / 180
  const lat = center.lat * Math.PI / 180
  const far: [number, number] = [
    center.lng + Math.sin(bearing) * FAR_METERS / (111_320 * Math.cos(lat)),
    Math.min(85, center.lat + Math.cos(bearing) * FAR_METERS / 110_540),
  ]
  const { y } = instance.project(far)
  return Number.isFinite(y) ? y : null
}

function updateHaze() {
  const instance = map?.value
  const color = sky?.['fog-color']
  if (!instance || typeof color !== 'string')
    return
  const height = instance.getCanvas().clientHeight
  const y = horizonY(instance)
  // Горизонт за верхним краем — вид почти сверху, дымка не нужна
  if (y === null || y < -HAZE_ABOVE_PX || instance.getPitch() < 40) {
    haze.style.opacity = '0'
    return
  }
  const depth = (height - y) * HAZE_DEPTH
  haze.style.opacity = '1'
  haze.style.top = `${y - HAZE_ABOVE_PX}px`
  haze.style.height = `${HAZE_ABOVE_PX + depth}px`
  haze.style.background = `linear-gradient(to bottom, transparent 0%, ${color} ${Math.round(HAZE_ABOVE_PX / (HAZE_ABOVE_PX + depth) * 100)}%, transparent 100%)`
}

function scheduleHaze() {
  if (hazeFrame)
    return
  hazeFrame = requestAnimationFrame(() => {
    hazeFrame = 0
    updateHaze()
  })
}

function apply() {
  const instance = map?.value
  if (!instance)
    return
  if (!sky)
    compute(instance)
  if (JSON.stringify(instance.getSky()) === applied)
    return
  try {
    instance.setSky(sky!)
    applied = JSON.stringify(instance.getSky())
  }
  catch {
    // Стиль ещё не загружен — повторим на следующем styledata
  }
}

function refresh() {
  const instance = map?.value
  if (!instance)
    return
  compute(instance)
  applied = ''
  apply()
}

const timer = setInterval(refresh, SKY_UPDATE_MS)
watch([resolvedTheme, () => weatherStore.weather], refresh)

// Смена темы (setStyle с diff) может сбросить небо стиля — возвращаем своё
watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', apply)
  previous?.off('move', scheduleHaze)
  previous?.off('resize', scheduleHaze)
  instance?.on('styledata', apply)
  instance?.on('move', scheduleHaze)
  instance?.on('resize', scheduleHaze)
  if (instance) {
    const canvas = instance.getCanvas()
    canvas.after(haze)
    scheduleHaze()
  }
  apply()
}, { immediate: true })

onUnmounted(() => {
  cancelAnimationFrame(hazeFrame)
  haze.remove()
  map?.value?.off('move', scheduleHaze)
  map?.value?.off('resize', scheduleHaze)
  clearInterval(timer)
  map?.value?.off('styledata', apply)
})
</script>

<template>
  <slot />
</template>

<style lang="scss">
.map-haze {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>
