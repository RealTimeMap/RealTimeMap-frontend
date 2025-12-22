<script setup lang="ts">
import type { YMap } from '@yandex/ymaps3-types'
import { AddMarkMode } from '../components/02.features/AddMarkMode'
import { useAuthStore } from '../components/02.features/Authentication/model/auth'
import { GeolocationFeedback } from '../components/02.features/Geolocation'
import { useGeolocation } from '../components/02.features/Geolocation/composables/useGeolocation'
import MarksLayer from '../components/02.features/GetMarks/ui/MarksLayer.vue'
import { BaseMapView } from '../components/02.features/MapCore'

const {
  userPosition,
  error: geolocationError,
  isLoading: isLoadingGeolocation,
} = useGeolocation()
const mapApi = shallowRef<null | YMap>(null)

function handleMapReady(map: YMap) {
  mapApi.value = map
}

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
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
      v-if="!isLoadingGeolocation && !geolocationError && userPosition"
      :center-coordinates="userPosition"
      :zoom-level="15"
      :show-user-marker="false"
      class="col"
      @map-ready="handleMapReady"
    >
      <marks-layer
        :coordinates="userPosition"
      />
      <UMarker
        :coordinates="userPosition"
        :draggable="false"
        :media="{
          photoUrl: user?.avatar || '',
        }"
      />
      <add-mark-mode />
    </base-map-view>
  </main>
</template>
