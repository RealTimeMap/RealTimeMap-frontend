<script setup lang="ts">
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { buildTransformRequest, registerOfflineMapProtocol } from '@/components/02.features/OfflineMap'
import { useShareStore } from '../../Share/model'
import { onDoubleTap } from '../model/useDoubleTap'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  centerCoordinates: [number, number]
  zoomLevel: number
}>()

const emit = defineEmits<MapEmits>()

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

onMounted(() => {
  registerOfflineMapProtocol()

  const mapInstance = new maplibregl.Map({
    container: mapContainer.value!,
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
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
