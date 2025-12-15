<script setup lang="ts">
import type { LngLat, LngLatBounds, YMap } from '@yandex/ymaps3-types'
import {
  YandexMap,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultMarker,
  YandexMapDefaultSchemeLayer,
  YandexMapListener,
} from 'vue-yandex-maps'
import { useSettingsStore } from '../../app-settings/model/settings'

interface Props {
  centerCoordinates: LngLat
  zoomLevel?: number
  showUserMarker?: boolean
  userMarkerSettings?: object
}

const props = withDefaults(defineProps<Props>(), {
  zoomLevel: 13,
  showUserMarker: true,
  userMarkerSettings: () => ({ /* по умолчанию пустой объект */ }),
})

const emit = defineEmits<{
  (e: 'mapReady', mapInstance: YMap): void
  (e: 'update:bounds', bounds: LngLatBounds): void
}>()

const mapInstance = shallowRef<null | YMap>(null)

watch(mapInstance, (newMap) => {
  if (newMap) {
    emit('mapReady', newMap)
  }
})

const zoom = ref(props.zoomLevel)
const center = ref(props.centerCoordinates)

function onMapZoomChange(event: any) {
  const newZoom = event?.location?.zoom
  const newCenter = event?.location?.center

  if (newCenter) {
    center.value = newCenter
  }

  if (typeof newZoom === 'number') {
    zoom.value = newZoom
  }

  if (mapInstance.value) {
    const currentBounds = mapInstance.value.bounds

    if (currentBounds) {
      emit('update:bounds', currentBounds)
    }
  }
}

const settingsStore = useSettingsStore()

const mapTheme = computed(() => {
  return settingsStore.currentTheme === 'dark' ? 'dark' : 'light'
})
</script>

<template>
  <yandex-map
    :key="mapTheme"
    v-model="mapInstance"
    :settings="{
      location: {
        center,
        zoom,
      },
      zoomRange: {
        min: 13,
        max: 18,
      },
      theme: mapTheme,
    }"

    width="100%"
    height="100%"
  >
    <yandex-map-default-scheme-layer />
    <yandex-map-default-features-layer />

    <yandex-map-default-marker
      v-if="props.showUserMarker"
      :settings="{
        coordinates: centerCoordinates,
        ...props.userMarkerSettings,
      }"
    />
    <slot />
    <yandex-map-listener
      :settings="{
        onUpdate: onMapZoomChange,
      }"
    />
  </yandex-map>
</template>
