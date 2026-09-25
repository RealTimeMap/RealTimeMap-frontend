<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { mapNow } from '@/components/00.shared/lib/mapClock'
import { useMapStyleBase } from '@/components/00.shared/lib/mapStyleBase'
import { moonPosition, sunPosition } from '@/components/00.shared/lib/sun'
import { overcast, useWeatherStore } from '@/components/02.features/map/Weather'
import { drawMoon } from '../model/moonDisc'
import { skyFor } from '../model/skyColors'
import { starfield } from '../model/space'

const SKY_UPDATE_MS = 5 * 60_000

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const styleBase = useMapStyleBase()
const weatherStore = useWeatherStore()

// Небо считается по таймеру и теме, а на styledata только возвращается: setSky сам вызывает styledata
let sky: maplibregl.SkySpecification | null = null
/** Небо, каким его вернула карта после нашего setSky, — сравниваем с ним, а не со своим объектом. */
let applied = ''

function compute(instance: maplibregl.Map) {
  const { lng, lat } = instance.getCenter()
  const date = mapNow()
  const sun = sunPosition(date, lng, lat)
  const clouds = overcast(weatherStore.weather)
  sky = skyFor(styleBase.value, sun, clouds)
  computeNight(date, lng, lat, sun.altitude, clouds)
  updateHaze()
}

// --- Ночное небо над городом: звёзды и луна ---
// Небо MapLibre умеет только градиент, поэтому звёзды и луна — элементы поверх неба над горизонтом.
// Звёзды — та же картинка, что за шаром; при повороте карты они сдвигаются, как настоящее небо

const nightSky = document.createElement('div')
nightSky.className = 'map-night-sky'
const moon = document.createElement('canvas')
moon.className = 'map-moon'
moon.width = 64
moon.height = 64
const MOON_PX = 32

let starsOpacity = 0
let moonState: { azimuth: number, altitude: number, opacity: number } | null = null
let drawnPhase = -1

function computeNight(date: Date, lng: number, lat: number, sunAltitude: number, clouds: number) {
  // Звёзды проступают после заката и полностью видны в темноте; облака их закрывают
  const darkness = Math.min(1, Math.max(0, (-2 - sunAltitude) / 10))
  starsOpacity = Math.round(darkness * (1 - clouds) * 100) / 100
  const position = moonPosition(date, lng, lat)
  if (position.altitude < -1) {
    moonState = null
    return
  }
  // Днём луна бледная, ночью яркая; за сплошными облаками её не видно
  const opacity = (0.35 + 0.65 * darkness) * (1 - clouds * 0.9)
  moonState = { azimuth: position.azimuth, altitude: position.altitude, opacity }
  if (Math.abs(position.phase - drawnPhase) > 0.005) {
    drawMoon(moon, position.phase, lat < 0)
    drawnPhase = position.phase
  }
}

function updateNight(instance: maplibregl.Map, horizon: number) {
  const width = instance.getCanvas().clientWidth
  const pixelsPerDegree = instance.getCanvas().clientHeight / instance.getVerticalFieldOfView()
  const bearing = instance.getBearing()

  nightSky.style.opacity = String(starsOpacity)
  nightSky.style.height = `${Math.max(0, horizon)}px`
  nightSky.style.backgroundPositionX = `${Math.round(-bearing * pixelsPerDegree)}px`

  if (!moonState || moonState.opacity <= 0.02) {
    moon.style.opacity = '0'
    return
  }
  const offset = ((moonState.azimuth - bearing + 540) % 360) - 180
  const x = width / 2 + offset * pixelsPerDegree
  // Над горизонтом видно лишь несколько градусов неба — настоящая высота луны почти всегда за краем экрана.
  // Направление честное, а высота сжата в видимую полоску: низкая луна у горизонта, высокая — у верха полоски
  const band = Math.max(0, horizon - MOON_PX)
  const y = horizon - MOON_PX * 0.6 - (Math.min(moonState.altitude, 90) / 90) ** 0.6 * band
  const visible = band > MOON_PX * 0.5 && x > -MOON_PX && x < width + MOON_PX
  moon.style.opacity = visible ? String(moonState.opacity) : '0'
  moon.style.transform = `translate(${Math.round(x - MOON_PX / 2)}px, ${Math.round(y - MOON_PX / 2)}px)`
}

function hideNight() {
  nightSky.style.opacity = '0'
  moon.style.opacity = '0'
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
    hideNight()
    return
  }
  updateNight(instance, y)
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
watch([styleBase, () => weatherStore.weather], refresh)

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
    // Порядок: небо со звёздами и луной, над ними дымка у горизонта
    canvas.after(nightSky, moon, haze)
    scheduleHaze()
    // Фон за шаром: при отдалении вокруг Земли космос, а не пустота
    const container = instance.getContainer()
    container.classList.add('map-space')
    container.style.setProperty('--map-stars', `url(${starfield()})`)
  }
  apply()
}, { immediate: true })

onUnmounted(() => {
  cancelAnimationFrame(hazeFrame)
  haze.remove()
  nightSky.remove()
  moon.remove()
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
.map-space {
  background:
    var(--map-stars) 0 0 / 256px 256px repeat,
    radial-gradient(ellipse at 50% 60%, #16213d 0%, #0a0f1f 55%, #05070d 100%);
}

.map-night-sky {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--map-stars) 0 0 / 256px 256px repeat;
  // Звёзды гаснут к горизонту — там воздух плотнее и светлее от города
  mask-image: linear-gradient(to bottom, #000 40%, transparent 100%);
  transition: opacity 1s ease;
}

.map-moon {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  width: 32px;
  height: 32px;
  pointer-events: none;
  transition: opacity 1s ease;
}

.map-haze {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>
