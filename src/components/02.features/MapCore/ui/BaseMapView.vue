<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import { useSettingsStore } from '../../AppSettings/model/settings'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapEmits {
  (e: 'mapReady', mapInstance: maplibregl.Map): void
  (e: 'update:bounds', bounds: [[number, number], [number, number]]): void
  (e: 'dblClickMarker', coordinates: [number, number]): void
  (e: 'update:zoom-level', zoomLevel: number): void
}

const props = defineProps<{
  centerCoordinates: [number, number]
  zoomLevel: number
}>()

const emit = defineEmits<MapEmits>()

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const settingsStore = useSettingsStore()

onMounted(() => {
  const mapInstance = new maplibregl.Map({
    container: mapContainer.value!,
    style: settingsStore.currentTheme === 'dark'
      ? 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json'
      : 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
    center: props.centerCoordinates,
    zoom: props.zoomLevel,
    doubleClickZoom: false,
    attributionControl: false,
  })

  map.value = mapInstance

  mapInstance.on('load', () => {
    emit('mapReady', mapInstance)
  })

  mapInstance.on('moveend', () => {
    const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]]
    emit('update:bounds', bounds)
  })
  mapInstance.on('dblclick', (e) => {
    emit('dblClickMarker', [e.lngLat.lng, e.lngLat.lat])
  })
  mapInstance.on('zoomend', () => {
    emit('update:zoom-level', mapInstance.getZoom())
  })
})

onUnmounted(() => map.value?.remove())

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
