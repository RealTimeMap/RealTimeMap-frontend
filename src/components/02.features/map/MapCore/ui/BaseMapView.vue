<script setup lang="ts">
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { storeToRefs } from 'pinia'
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
const styleBase = computed(() => globeView.value ? 'dark' : themeBase(resolvedTheme.value))
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
    mapInstance.setMinZoom(2.5)
  })

  const emitBounds = () => {
    const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]]
    emit('update:bounds', bounds)
  }

  mapInstance.on('load', () => {
    emit('mapReady', mapInstance)
    emitBounds()
  })

  const limitPitch = () => {
    const zoom = mapInstance.getZoom()
    const allowed = Math.round(MAX_PITCH * Math.min(1, Math.max(0, (zoom - FLAT_ZOOM) / (FULL_PITCH_ZOOM - FLAT_ZOOM))))
    if (allowed !== mapInstance.getMaxPitch())
      mapInstance.setMaxPitch(allowed)
  }
  mapInstance.on('zoom', limitPitch)
  limitPitch()

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

watch(resolvedTheme, () => applyStyle(550))
watch(globeView, () => applyStyle(0))

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
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
