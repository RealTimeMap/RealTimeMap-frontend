<script setup lang="ts">
import type { Map } from 'maplibre-gl'
import type { MapBounds, MapPoint } from '@/types/shared/map'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import { GeolocationFeedback } from '@/components/02.features/Geolocation'
import { useGeolocation } from '@/components/02.features/Geolocation/model/useGeolocation'
import MarksLayer from '@/components/02.features/GetMarks/ui/MarksLayer.vue'
import LocateButton from '@/components/02.features/LocateButton'
import { BaseMapView } from '@/components/02.features/MapCore'
import MarkForm from '@/components/02.features/MarkForm'
import SearchUsers from '@/components/02.features/SearchUsers'

const {
  userPosition,
  error: geolocationError,
  isLoading: isLoadingGeolocation,
} = useGeolocation()

const { open } = useDialogStore()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const mapApi = shallowRef<null | Map>(null)
const markAddCoords = ref<null | MapPoint>(null)
const screenBounds = ref<MapBounds | null>(null)
const zoomLevel = ref<number>(15)

function handleMapReady(map: Map) {
  mapApi.value = map
}

function handleMapClick(coordinates: MapPoint) {
  // if (isAuthenticated)
  //   return
  markAddCoords.value = coordinates
  open(MarkForm, {
    coords: coordinates,
  }, {
    position: 'end center',
    headerModal: false,
  })
}

function handleUpdateBounds(bounds: MapBounds) {
  screenBounds.value = bounds
}

function handleUpdateZoom(newZoom: number) {
  zoomLevel.value = newZoom
}

const mapInitialCenter = shallowRef<MapPoint | null>(null)
watch(userPosition, (newPos) => {
  if (newPos && !mapInitialCenter.value) {
    mapInitialCenter.value = newPos
  }
}, { immediate: true })
</script>

<template>
  <div
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
    </base-map-view>
    <search-users
      v-if="!isLoadingGeolocation && !geolocationError"
    />
    <locate-button
      :user-position="userPosition"
      :map-api="mapApi"
    />
  </div>
</template>
