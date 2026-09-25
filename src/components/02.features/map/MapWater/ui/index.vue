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
import { drawGlints, drawIce, PIXEL_RATIO, TILE } from '../model/waterPattern'

const LAYER_ID = 'water-glints'
const IMAGE_ID = 'water-glints'
/** Слой воды стиля CARTO — блики кладём сразу над ним. */
const WATER_LAYER = 'water'
const CARTO_SOURCE = 'carto'
/** Шаг кадров: блики покачиваются медленно, чаще — только лишняя перерисовка карты и загрузка текстуры. */
const FRAME_MS = 160
/** Сколько вода «живёт» после движения карты — потом замирает, и карта не перерисовывается впустую. */
const ACTIVE_MS = 20_000
/** Мельче вода — линии и пятна, блики на них не видны. */
const MIN_ZOOM = 11

const BASE_OPACITY: Record<ThemeBase, number> = { light: 0.6, dark: 0.35 }
/** Осенью вода темнее и бликов меньше, зимой узор льда чуть приглушён. */
const SEASON_OPACITY: Record<Season, number> = { spring: 1, summer: 1, autumn: 0.55, winter: 0.8 }

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { mapSeason, resolvedTheme } = storeToRefs(useSettingsStore())
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

/** Узор привязан к пикселям экрана — густота бликов на экране одинаковая при любом зуме. */
function opacity(instance: maplibregl.Map): number {
  const value = BASE_OPACITY[themeBase(resolvedTheme.value)] * SEASON_OPACITY[currentSeason(instance)] * nightFactor(instance)
  return Math.round(value * 100) / 100
}

const isIce = (instance: maplibregl.Map) => currentSeason(instance) === 'winter'

function patternData(instance: maplibregl.Map) {
  return { width: TILE, height: TILE, data: isIce(instance) ? drawIce() : drawGlints(performance.now() / 1000) }
}

function beforeId(instance: maplibregl.Map): string | undefined {
  const layers = instance.getStyle().layers
  return layers[layers.findIndex(layer => layer.id === WATER_LAYER) + 1]?.id
}

function ensureLayer(instance: maplibregl.Map) {
  if (!instance.getLayer(WATER_LAYER))
    return
  if (!instance.hasImage(IMAGE_ID))
    instance.addImage(IMAGE_ID, patternData(instance), { pixelRatio: PIXEL_RATIO })
  if (instance.getLayer(LAYER_ID))
    return
  instance.addLayer({
    'id': LAYER_ID,
    'type': 'fill',
    'source': CARTO_SOURCE,
    'source-layer': 'water',
    'filter': ['==', ['geometry-type'], 'Polygon'],
    'minzoom': MIN_ZOOM,
    'paint': {
      'fill-pattern': IMAGE_ID,
      'fill-opacity': opacity(instance),
    },
  }, beforeId(instance))
}

/** Сезон, тема или время суток поменялись — перерисовываем узор и прозрачность. */
function refresh() {
  const instance = map?.value
  if (!instance?.getLayer(LAYER_ID))
    return
  instance.updateImage(IMAGE_ID, patternData(instance))
  instance.setPaintProperty(LAYER_ID, 'fill-opacity', opacity(instance))
  wake()
}

// --- Анимация: только некоторое время после движения карты ---
let frameTimer: ReturnType<typeof setInterval> | undefined
let sleepAt = 0
let pageActive = true

function canAnimate(instance: maplibregl.Map): boolean {
  return pageActive
    && !reducedMotion.matches
    && document.visibilityState === 'visible'
    && instance.getZoom() >= MIN_ZOOM
    && !isIce(instance)
    && !!instance.getLayer(LAYER_ID)
}

function frame() {
  const instance = map?.value
  if (!instance || Date.now() > sleepAt || !canAnimate(instance)) {
    clearInterval(frameTimer)
    frameTimer = undefined
    return
  }
  instance.updateImage(IMAGE_ID, patternData(instance))
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
  if (!instance.getLayer(LAYER_ID)) {
    ensureLayer(instance)
    wake()
  }
}

watch([mapSeason, resolvedTheme], refresh)
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
  if (instance.getLayer(LAYER_ID))
    instance.removeLayer(LAYER_ID)
  if (instance.hasImage(IMAGE_ID))
    instance.removeImage(IMAGE_ID)
})
</script>

<template>
  <slot />
</template>
