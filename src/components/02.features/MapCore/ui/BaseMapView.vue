<script setup lang="ts">
import type {
  BehaviorType,
  DomEvent,
  DomEventHandlerObject,
  LngLat,
  LngLatBounds,
  YMap,
} from '@yandex/ymaps3-types'
import type { YMapLocation } from '@yandex/ymaps3-types/imperative/YMap'
import {
  YandexMap,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultMarker,
  YandexMapDefaultSchemeLayer,
  YandexMapListener,
} from 'vue-yandex-maps'
import { useSettingsStore } from '../../AppSettings/model/settings'

interface Props {
  centerCoordinates: LngLat
  zoomLevel: number
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
  (e: 'dblClickMarker', coordinates: LngLat): void
  (e: 'update:zoom-level', zoomLevel: number): void
}>()

const mapInstance = shallowRef<null | YMap>(null)

watch(mapInstance, (newMap) => {
  if (newMap) {
    emit('mapReady', newMap)
  }
})

const zoomLocal = ref()
const centerLocal = ref()

watch(() => props.centerCoordinates, (newCenter) => {
  centerLocal.value = newCenter
}, { immediate: true, deep: true })

watch (() => props.zoomLevel, (newZoom) => {
  zoomLocal.value = newZoom
}, { immediate: true })

function onMapUpdate({ location }: { location: YMapLocation }): void {
  const { zoom, center } = location

  if (center) {
    centerLocal.value = center
  }

  if (typeof zoom === 'number') {
    zoomLocal.value = zoom
    emit('update:zoom-level', zoom)
  }

  const currentBounds = mapInstance.value?.bounds
  if (currentBounds) {
    emit('update:bounds', currentBounds)
  }
}

function onMapDblClick(_object: DomEventHandlerObject, event: DomEvent) {
  if (event.coordinates) {
    emit('dblClickMarker', event.coordinates)
  }
}

const MAP_BEHAVIORS: BehaviorType[] = ['drag', 'scrollZoom', 'pinchZoom', 'magnifier']
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
        center: centerLocal,
        zoom: zoomLocal,
      },
      behaviors: MAP_BEHAVIORS,
      zoomRange: {
        min: 5,
        max: 17,
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
        onUpdate: onMapUpdate,
        onDblClick: onMapDblClick,
      }"
    />
  </yandex-map>
</template>
