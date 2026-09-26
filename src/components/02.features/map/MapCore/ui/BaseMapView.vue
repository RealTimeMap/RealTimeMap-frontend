<script setup lang="ts">
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { storeToRefs } from 'pinia'
import { MAP_STYLE_BASE } from '@/components/00.shared/lib/mapStyleBase'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { buildTransformRequest, registerOfflineMapProtocol } from '@/components/02.features/map/OfflineMap'
import { useShareStore } from '@/components/02.features/mark/Share/model'
import { onDoubleTap } from '../model/useDoubleTap'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  centerCoordinates: [number, number]
  zoomLevel: number
}>()

const emit = defineEmits<MapEmits>()

const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
} as const

maplibregl.setWorkerUrl(maplibreWorkerUrl)

/**
 * Выше 60° виден горизонт и небо. Больше 70° не даём: дальняя граница видимости уходит к горизонту,
 * точности глубины перестаёт хватать, и стены соседних частей зданий покрываются рябью.
 */
const MAX_PITCH = 70
/** С этого зума и дальше карта только плоская; наклон растёт до полного к FULL_PITCH_ZOOM. */
const FLAT_ZOOM = 9
const FULL_PITCH_ZOOM = 12
/**
 * Светлый шар на тёмном космосе выглядел пятном: ниже GLOBE_ZOOM карта берёт тёмный стиль, выше
 * GLOBE_EXIT_ZOOM — стиль темы. Зазор между порогами — чтобы не переключаться туда-обратно на границе.
 */
const GLOBE_ZOOM = 4.5
const GLOBE_EXIT_ZOOM = 5
/** Угол обзора по вертикали: стандартный MapLibre и расширенный при полном наклоне. */
const BASE_FOV = 36.87
const WIDE_FOV = 60
const WIDE_FROM_PITCH = 45
/** С CLOSE_ZOOM наклон и угол обзора плавно уменьшаются, к GROUND_ZOOM наклон — CLOSE_PITCH. */
const CLOSE_ZOOM = 17
const GROUND_ZOOM = 19
const CLOSE_PITCH = 50

const shareStore = useShareStore()
interface MapEmits {
  (e: 'mapReady', mapInstance: maplibregl.Map): void
  (e: 'update:bounds', bounds: [[number, number], [number, number]]): void
  (e: 'dblClickMarker', coordinates: [number, number]): void
  (e: 'update:zoomLevel', zoomLevel: number): void
}

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const { resolvedTheme } = storeToRefs(useSettingsStore())
const globeView = ref(props.zoomLevel < GLOBE_ZOOM)
const styleBase = computed<ThemeBase>(() => globeView.value ? 'dark' : themeBase(resolvedTheme.value))
provide(MAP_STYLE_BASE, styleBase)
let offDoubleTap: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  registerOfflineMapProtocol()

  const mapInstance = new maplibregl.Map({
    container: mapContainer.value!,
    style: MAP_STYLES[styleBase.value],
    center: props.centerCoordinates,
    zoom: props.zoomLevel,
    renderWorldCopies: false,
    doubleClickZoom: false,
    attributionControl: false,
    transformRequest: buildTransformRequest(),
    canvasContextAttributes: { antialias: true },
    // На экранах 3× разница с 2× почти не видна, а пикселей для GPU в 2,25 раза больше
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    fadeDuration: 0,
    refreshExpiredTiles: false,
    trackResize: false,
    maxPitch: MAX_PITCH,
  })

  map.value = mapInstance

  const container = mapContainer.value!
  let lastSize = `${container.clientWidth}x${container.clientHeight}`
  resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry!.contentRect
    const size = `${width}x${height}`
    if (!width || !height || size === lastSize)
      return
    lastSize = size
    mapInstance.resize()
  })
  resizeObserver.observe(container)

  mapInstance.on('style.load', () => {
    mapInstance.setProjection({
      type: 'globe',
    })
    mapInstance.setMinZoom(1.5)
  })

  const emitBounds = () => {
    const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]]
    emit('update:bounds', bounds)
  }

  // Для полюсов и открытого океана у CARTO тайлов нет: сервер отвечает ошибкой без CORS,
  // браузер видит «Failed to fetch (0)». Это не поломка — карта там просто пустая. Остальные ошибки — в лог
  mapInstance.on('error', (event) => {
    const error = event.error as { status?: number, url?: string } | undefined
    if (error?.url?.includes('basemaps.cartocdn.com') && (error.status === 0 || error.status === 404))
      return
    console.error(event.error)
  })

  mapInstance.on('load', () => {
    emit('mapReady', mapInstance)
    emitBounds()
  })

  const limitPitch = () => {
    const zoom = mapInstance.getZoom()
    const far = Math.min(1, Math.max(0, (zoom - FLAT_ZOOM) / (FULL_PITCH_ZOOM - FLAT_ZOOM)))
    // Вплотную к домам сильный наклон кладёт камеру на землю: горизонт посреди экрана, всё поле — асфальт
    const near = Math.min(1, Math.max(0, (zoom - CLOSE_ZOOM) / (GROUND_ZOOM - CLOSE_ZOOM)))
    const allowed = Math.round(MAX_PITCH * far - (MAX_PITCH - CLOSE_PITCH) * near)
    if (allowed !== mapInstance.getMaxPitch())
      mapInstance.setMaxPitch(allowed)
  }
  mapInstance.on('zoom', limitPitch)
  limitPitch()

  // При сильном наклоне угол обзора расширяется: над горизонтом видно небо, звёзды и луну.
  // Наклон больше 70° не даём из-за ряби на стенах — расширение обзора даёт тот же вид без неё
  const widenView = () => {
    // Вблизи обзор не расширяем: широкий угол там искажает дома, как объектив «рыбий глаз»
    const close = Math.min(1, Math.max(0, (mapInstance.getZoom() - CLOSE_ZOOM) / (GROUND_ZOOM - CLOSE_ZOOM)))
    const t = (1 - close) * Math.min(1, Math.max(0, (mapInstance.getPitch() - WIDE_FROM_PITCH) / (MAX_PITCH - WIDE_FROM_PITCH)))
    const fov = Math.round((BASE_FOV + (WIDE_FOV - BASE_FOV) * t) * 10) / 10
    if (Math.abs(fov - mapInstance.getVerticalFieldOfView()) > 0.05)
      mapInstance.setVerticalFieldOfView(fov)
  }
  mapInstance.on('pitch', widenView)
  mapInstance.on('zoom', widenView)
  widenView()

  mapInstance.on('moveend', emitBounds)
  offDoubleTap = onDoubleTap(mapInstance, (e) => {
    emit('dblClickMarker', [e.lngLat.lng, e.lngLat.lat])
  })
  mapInstance.on('zoomend', () => {
    emit('update:zoomLevel', mapInstance.getZoom())
  })

  shareStore.registerMap(mapInstance)
})

function trackGlobe() {
  const zoom = map.value?.getZoom()
  if (zoom === undefined)
    return
  if (!globeView.value && zoom < GLOBE_ZOOM)
    globeView.value = true
  else if (globeView.value && zoom > GLOBE_EXIT_ZOOM)
    globeView.value = false
}

watch(map, (instance, previous) => {
  previous?.off('zoom', trackGlobe)
  instance?.on('zoom', trackGlobe)
})

let styleTimer: ReturnType<typeof setTimeout> | null = null
function applyStyle(delay: number) {
  if (styleTimer)
    clearTimeout(styleTimer)
  styleTimer = setTimeout(() => map.value?.setStyle(MAP_STYLES[styleBase.value]), delay)
}

/** Затемнение при переходе к шару: стиль меняется в самой тёмной точке, скачка цвета не видно. */
const STYLE_FADE_MS = 520
const styleFading = ref(false)
let fadeTimer: ReturnType<typeof setTimeout> | null = null

function fadeToStyle() {
  styleFading.value = false
  if (fadeTimer)
    clearTimeout(fadeTimer)
  // Кадр паузы — анимация перезапускается, если порог пересекли снова во время прошлого перехода
  requestAnimationFrame(() => {
    styleFading.value = true
    applyStyle(STYLE_FADE_MS * 0.4)
    fadeTimer = setTimeout(() => {
      styleFading.value = false
    }, STYLE_FADE_MS)
  })
}

// Смена темы в настройках — с паузой под анимацию переключателя; переход к шару и обратно — через затемнение
watch(resolvedTheme, () => applyStyle(550))
watch(globeView, fadeToStyle)

onUnmounted(() => {
  if (styleTimer)
    clearTimeout(styleTimer)
  offDoubleTap?.()
  resizeObserver?.disconnect()
  map.value?.remove()
})

provide('map', map)
</script>

<template>
  <div
    ref="mapContainer"
    class="map-container"
  >
    <slot v-if="map" />
    <div
      v-if="styleFading"
      class="map-style-fade"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}

.map-style-fade {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: #05070d;
  animation: map-style-fade 0.52s ease-in-out both;
}

@keyframes map-style-fade {
  0%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 0.85;
  }
}
</style>
