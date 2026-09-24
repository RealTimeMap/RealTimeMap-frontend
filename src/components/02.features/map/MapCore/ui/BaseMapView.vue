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

const shareStore = useShareStore()
interface MapEmits {
  (e: 'mapReady', mapInstance: maplibregl.Map): void
  (e: 'update:bounds', bounds: [[number, number], [number, number]]): void
  (e: 'dblClickMarker', coordinates: [number, number]): void
  (e: 'update:zoomLevel', zoomLevel: number): void
}

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
let offDoubleTap: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

const { resolvedTheme } = storeToRefs(useSettingsStore())

onMounted(() => {
  registerOfflineMapProtocol()

  const mapInstance = new maplibregl.Map({
    container: mapContainer.value!,
    style: MAP_STYLES[themeBase(resolvedTheme.value)],
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
    mapInstance.setMinZoom(3)
  })

  const emitBounds = () => {
    const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]]
    emit('update:bounds', bounds)
  }

  mapInstance.on('load', () => {
    emit('mapReady', mapInstance)
    // Если карта ещё ни разу не двигалась (позиция пришла до загрузки), moveend не будет —
    // без начальных границ слой меток не узнает, что загружать
    emitBounds()
  })

  mapInstance.on('moveend', emitBounds)
  offDoubleTap = onDoubleTap(mapInstance, (e) => {
    emit('dblClickMarker', [e.lngLat.lng, e.lngLat.lat])
  })
  mapInstance.on('zoomend', () => {
    emit('update:zoomLevel', mapInstance.getZoom())
  })

  shareStore.registerMap(mapInstance)
})

let styleTimer: ReturnType<typeof setTimeout> | null = null
watch(resolvedTheme, (next) => {
  if (styleTimer)
    clearTimeout(styleTimer)
  styleTimer = setTimeout(() => {
    map.value?.setStyle(MAP_STYLES[themeBase(next)])
  }, 550)
})

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
