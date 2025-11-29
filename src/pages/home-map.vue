<script setup lang="ts">
import type { YMap } from '@yandex/ymaps3-types'
import { AddMarkMode } from '../components/02.features/add-mark-mode'
import { useAuthStore } from '../components/02.features/authentication/model/auth'
import { GeolocationFeedback } from '../components/02.features/geolocation'
import { useGeolocation } from '../components/02.features/geolocation/composables/useGeolocation'
import MarksLayer from '../components/02.features/get-marks/ui/marks-layer.vue'
import { BaseMapView } from '../components/02.features/map-core'

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
      :user-marker-settings="{ title: 'Мое местоположение', color: 'red' }"
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
