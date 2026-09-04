<script setup lang="ts">
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { storeToRefs } from 'pinia'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { buildTransformRequest, registerOfflineMapProtocol } from '@/components/02.features/OfflineMap'
import { useShareStore } from '../../Share/model'
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

const { resolvedTheme } = storeToRefs(useSettingsStore())

onMounted(() => {
  registerOfflineMapProtocol()

  const mapInstance = new maplibregl.Map({
    container: mapContainer.value!,
    style: MAP_STYLES[themeBase(resolvedTheme.value)],
    center: props.centerCoordinates,
    zoom: props.zoomLevel,
    doubleClickZoom: false,
    attributionControl: false,
    transformRequest: buildTransformRequest(),
    canvasContextAttributes: {
      preserveDrawingBuffer: true,
    },
  })

  map.value = mapInstance

  mapInstance.on('load', () => {
    emit('mapReady', mapInstance)
  })

  mapInstance.on('moveend', () => {
    const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]]
    emit('update:bounds', bounds)
  })
  offDoubleTap = onDoubleTap(mapInstance, (e) => {
    emit('dblClickMarker', [e.lngLat.lng, e.lngLat.lat])
  })
  mapInstance.on('zoomend', () => {
    emit('update:zoomLevel', mapInstance.getZoom())
  })

  shareStore.registerMap(mapInstance)
})

watch(resolvedTheme, (next) => {
  map.value?.setStyle(MAP_STYLES[themeBase(next)])
})

onUnmounted(() => {
  offDoubleTap?.()
  map.value?.remove()
})

onActivated(() => {
  map.value?.resize()
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
