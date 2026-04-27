<script setup lang="ts">
import type { LngLat, LngLatBounds, YMap } from '@yandex/ymaps3-types'
import MarkForm from '@/components/02.features/MarkForm'
import { useDialogStore } from '@/shared/stores/dialog'
import { AddMarkMode } from '../components/02.features/AddMarkMode'
import { useAuthStore } from '../components/02.features/Authentication/model/auth'
import { GeolocationFeedback } from '../components/02.features/Geolocation'
import { useGeolocation } from '../components/02.features/Geolocation/composables/useGeolocation'
import MarksLayer from '../components/02.features/GetMarks/ui/MarksLayer.vue'
import LocateButton from '../components/02.features/LocateButton'
import { BaseMapView } from '../components/02.features/MapCore'

const {
  userPosition,
  error: geolocationError,
  isLoading: isLoadingGeolocation,
} = useGeolocation()
const { open } = useDialogStore()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const mapApi = shallowRef<null | YMap>(null)
const markAddCoords = ref<null | LngLat>(null)
const screenBounds = ref<null | LngLatBounds>(null)
const zoomLevel = ref<number>(15)

function handleMapReady(map: YMap) {
  mapApi.value = map
}

function handleMapClick(coordinates: LngLat) {
  // if (isAuthenticated)
  //   return
  markAddCoords.value = coordinates
  open(MarkForm, {
    coords: coordinates,
  }, {
    position: 'flex-end',
    headerModal: false,
  })
}

function handleUpdateBounds(bounds: LngLatBounds) {
  screenBounds.value = bounds
}

function handleUpdateZoom(newZoom: number) {
  zoomLevel.value = newZoom
}

const mapInitialCenter = shallowRef<LngLat | null>(null)
watch(userPosition, (newPos) => {
  if (newPos && !mapInitialCenter.value) {
    mapInitialCenter.value = newPos
  }
}, { immediate: true })
</script>

<template>
  <main
    class="column items-stretch"
    style="height: 100dvh;"
  >
    <geolocation-feedback
      v-if="isLoadingGeolocation || geolocationError"
      :is-loading="isLoadingGeolocation"
      :error="geolocationError"
      class="absolute-center"
    />
    <base-map-view
      v-if="!isLoadingGeolocation && !geolocationError && mapInitialCenter && userPosition"
      :center-coordinates="mapInitialCenter"
      :zoom-level="zoomLevel"
      :show-user-marker="false"
      class="col"
      @map-ready="handleMapReady"
      @dbl-click-marker="handleMapClick"
      @update:bounds="handleUpdateBounds"
      @update:zoom-level="handleUpdateZoom"
    >
      <marks-layer
        :user-coordinates="userPosition"
        :screen-bounds="screenBounds"
        :zoom-level="zoomLevel"
      />
      <u-marker
        :coordinates="userPosition"
        :draggable="false"
        :media="user?.avatar || 'https://avatars.githubusercontent.com/u/71484693?v=4'"
      />
      <add-mark-mode />
    </base-map-view>

    <locate-button
      :user-position="userPosition"
      :map-api="mapApi"
    />
  </main>
</template>
