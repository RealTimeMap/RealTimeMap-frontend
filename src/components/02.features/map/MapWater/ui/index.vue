<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { Season } from '@/components/00.shared/lib/season'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { storeToRefs } from 'pinia'
import { seasonAt } from '@/components/00.shared/lib/season'
import { sunPosition } from '@/components/00.shared/lib/sun'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { isWetNow, sunStrength, useWeatherStore } from '@/components/02.features/map/Weather'
import { drawFlow, drawIce, drawStill, PIXEL_RATIO } from '../model/waterPattern'

/** Реки и каналы: блики бегут вдоль русла по течению. */
const FLOW_LAYER = 'water-flow'
const FLOW_IMAGE = 'water-flow'
/** Озёра и пруды: неподвижные блики, зимой — лёд на всей воде. */
const STILL_LAYER = 'water-still'
const STILL_IMAGE = 'water-still'
const OWN_LAYERS = [STILL_LAYER, FLOW_LAYER]
/** Слой воды стиля CARTO — блики кладём сразу над ним. */
const WATER_LAYER = 'water'
const CARTO_SOURCE = 'carto'
/** Шаг кадров: ~15 в секунду — движение плавное, а полоса узора маленькая и обновляется дёшево. */
const FRAME_MS = 66
/** Сколько вода «живёт» после движения карты — потом замирает, и карта не перерисовывается впустую. */
const ACTIVE_MS = 20_000
/** Мельче вода — линии и пятна, блики на них не видны. */
const MIN_ZOOM = 12

/** На светлой воде белый блик еле виден — там он в полную силу. */
const BASE_OPACITY: Record<ThemeBase, number> = { light: 1, dark: 0.4 }
/** Осенью вода темнее и бликов меньше, зимой узор льда чуть приглушён. */
const SEASON_OPACITY: Record<Season, number> = { spring: 1, summer: 1, autumn: 0.55, winter: 0.8 }

/**
 * Ширина полосы течения. Ширину самой реки тайлы не знают, поэтому берём типичную для городской реки
 * (около 100 м на земле): ширина в пикселях удваивается с каждым зумом. Каналы уже.
 */
const FLOW_WIDTH_BY_ZOOM: maplibregl.ExpressionSpecification = [
  'interpolate',
  ['exponential', 2],
  ['zoom'],
  MIN_ZOOM,
  ['match', ['get', 'class'], 'canal', 3, 9],
  18,
  ['match', ['get', 'class'], 'canal', 192, 576],
]

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { mapSeason, resolvedTheme } = storeToRefs(useSettingsStore())
const weatherStore = useWeatherStore()
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

function currentSeason(instance: maplibregl.Map): Season {
  if (mapSeason.value === 'off')
    return 'summer'
  if (mapSeason.value !== 'auto')
    return mapSeason.value
  const { from, to, t } = seasonAt(new Date(), instance.getCenter().lat)
  return t < 0.5 ? from : to
}

/** Ночью блики почти гаснут: остаётся тёмная гладь. */
function nightFactor(instance: maplibregl.Map): number {
  const { lng, lat } = instance.getCenter()
  const { altitude } = sunPosition(new Date(), lng, lat)
  return Math.min(1, Math.max(0.25, 0.25 + (altitude + 6) / 12 * 0.75))
}

/** Блики — отражение солнца: в пасмурную погоду тусклее, в дождь рябь от капель почти гасит их. */
function weatherFactor(): number {
  const weather = weatherStore.weather
  return isWetNow(weather) ? 0.3 : 0.45 + 0.55 * sunStrength(weather)
}

function opacity(instance: maplibregl.Map): number {
  const value = BASE_OPACITY[themeBase(resolvedTheme.value)] * SEASON_OPACITY[currentSeason(instance)] * nightFactor(instance) * weatherFactor()
  return Math.round(value * 100) / 100
}

const isIce = (instance: maplibregl.Map) => currentSeason(instance) === 'winter'

/** Летом реки блестят течением, поэтому стоячие блики — только на озёрах и прудах; зимой лёд везде. */
function stillFilter(instance: maplibregl.Map): maplibregl.FilterSpecification {
  const polygon: maplibregl.FilterSpecification = ['==', ['geometry-type'], 'Polygon']
  return isIce(instance) ? polygon : ['all', polygon, ['!=', ['get', 'class'], 'river']]
}

function beforeId(instance: maplibregl.Map): string | undefined {
  const layers = instance.getStyle().layers
  return layers[layers.findIndex(layer => layer.id === WATER_LAYER) + 1]?.id
}

function ensureLayers(instance: maplibregl.Map) {
  if (!instance.getLayer(WATER_LAYER))
    return
  if (!instance.hasImage(STILL_IMAGE))
    instance.addImage(STILL_IMAGE, isIce(instance) ? drawIce() : drawStill(), { pixelRatio: PIXEL_RATIO })
  if (!instance.hasImage(FLOW_IMAGE))
    instance.addImage(FLOW_IMAGE, drawFlow(performance.now() / 1000), { pixelRatio: PIXEL_RATIO })
  const before = beforeId(instance)
  if (!instance.getLayer(STILL_LAYER)) {
    instance.addLayer({
      'id': STILL_LAYER,
      'type': 'fill',
      'source': CARTO_SOURCE,
      'source-layer': 'water',
      'filter': stillFilter(instance),
      'minzoom': MIN_ZOOM,
      'paint': {
        'fill-pattern': STILL_IMAGE,
        'fill-opacity': opacity(instance),
      },
    }, before)
  }
  if (!instance.getLayer(FLOW_LAYER)) {
    instance.addLayer({
      'id': FLOW_LAYER,
      'type': 'line',
      'source': CARTO_SOURCE,
      'source-layer': 'waterway',
      // Подземные участки не блестят; ручьи слишком узкие для бликов
      'filter': ['all', ['match', ['get', 'class'], ['river', 'canal'], true, false], ['!=', ['get', 'brunnel'], 'tunnel']],
      'minzoom': MIN_ZOOM,
      'layout': { 'line-join': 'round', 'visibility': isIce(instance) ? 'none' : 'visible' },
      'paint': {
        'line-pattern': FLOW_IMAGE,
        'line-width': FLOW_WIDTH_BY_ZOOM,
        'line-opacity': opacity(instance),
      },
    }, before)
  }
}

/** Сезон, тема или время суток поменялись — перерисовываем узоры и прозрачность. */
function refresh() {
  const instance = map?.value
  if (!instance?.getLayer(STILL_LAYER) || !instance.getLayer(FLOW_LAYER))
    return
  const ice = isIce(instance)
  instance.updateImage(STILL_IMAGE, ice ? drawIce() : drawStill())
  instance.setFilter(STILL_LAYER, stillFilter(instance))
  instance.setLayoutProperty(FLOW_LAYER, 'visibility', ice ? 'none' : 'visible')
  instance.setPaintProperty(STILL_LAYER, 'fill-opacity', opacity(instance))
  instance.setPaintProperty(FLOW_LAYER, 'line-opacity', opacity(instance))
  wake()
}

// --- Анимация течения: только некоторое время после движения карты ---
let frameTimer: ReturnType<typeof setInterval> | undefined
let sleepAt = 0
let pageActive = true

function canAnimate(instance: maplibregl.Map): boolean {
  return pageActive
    && !reducedMotion.matches
    && document.visibilityState === 'visible'
    && instance.getZoom() >= MIN_ZOOM
    && !isIce(instance)
    && !!instance.getLayer(FLOW_LAYER)
}

function frame() {
  const instance = map?.value
  if (!instance || Date.now() > sleepAt || !canAnimate(instance)) {
    clearInterval(frameTimer)
    frameTimer = undefined
    return
  }
  instance.updateImage(FLOW_IMAGE, drawFlow(performance.now() / 1000))
  instance.triggerRepaint()
}

function wake() {
  sleepAt = Date.now() + ACTIVE_MS
  if (!frameTimer)
    frameTimer = setInterval(frame, FRAME_MS)
}

// --- Стиль: слой возвращается после смены темы ---
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
  if (!instance.getLayer(STILL_LAYER) || !instance.getLayer(FLOW_LAYER)) {
    ensureLayers(instance)
    wake()
  }
}

watch([mapSeason, resolvedTheme, () => weatherStore.weather], refresh)
// Время суток и сезон в режиме «Авто» меняются медленно
const slowTimer = setInterval(refresh, 10 * 60_000)

watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', sync)
  previous?.off('movestart', wake)
  instance?.on('styledata', sync)
  instance?.on('movestart', wake)
  sync()
}, { immediate: true })

// Возврат на карту: анимацию запускаем после перехода страниц, чтобы не отнимать у него кадры
const RESUME_DELAY_MS = 900
let resumeTimer: ReturnType<typeof setTimeout> | undefined

onActivated(() => {
  resumeTimer = setTimeout(() => {
    pageActive = true
    wake()
  }, RESUME_DELAY_MS)
})
onDeactivated(() => {
  clearTimeout(resumeTimer)
  pageActive = false
})

onUnmounted(() => {
  clearTimeout(resumeTimer)
  clearInterval(frameTimer)
  clearInterval(slowTimer)
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', sync)
  instance.off('movestart', wake)
  for (const id of OWN_LAYERS) {
    if (instance.getLayer(id))
      instance.removeLayer(id)
  }
  for (const id of [STILL_IMAGE, FLOW_IMAGE]) {
    if (instance.hasImage(id))
      instance.removeImage(id)
  }
})
</script>

<template>
  <slot />
</template>
