<script setup lang="ts">
import type { Map } from 'maplibre-gl'
import type { MapBounds, MapPoint } from '@/types/shared/map'
import { useAuthStore } from '@/components/00.shared/stores/auth'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useMapCoach } from '@/components/02.features/app/Onboarding/model/useMapCoach'
import CoachHint from '@/components/02.features/app/Onboarding/ui/CoachHint.vue'
import { Buildings3D } from '@/components/02.features/map/Buildings3D'
import { GeolocationFeedback, HeadingCone, useCompass } from '@/components/02.features/map/Geolocation'
import { useGeolocation } from '@/components/02.features/map/Geolocation/model/useGeolocation'
import { MarksLayer, NearbyMarks } from '@/components/02.features/map/GetMarks'
import { LandmarksLayer } from '@/components/02.features/map/LandmarksLayer'
import { BaseMapView } from '@/components/02.features/map/MapCore'
import { MapSeasons } from '@/components/02.features/map/MapSeasons'
import { MapSky } from '@/components/02.features/map/MapSky'
import { MapTrees } from '@/components/02.features/map/MapTrees'
import { MapWater } from '@/components/02.features/map/MapWater'
import { RouteBanner, useRouteStore } from '@/components/02.features/map/RouteToMark'
import { WeatherChip } from '@/components/02.features/map/Weather'
import MarkCreateMenu from '@/components/02.features/mark/MarkCreateMenu'
import MarkForm from '@/components/02.features/mark/MarkForm'
import { useShareStore } from '@/components/02.features/mark/Share/model'
import { openPersonalMarkForm } from '@/components/02.features/places/PersonalMarkForm'
import { PersonalMarksLayer } from '@/components/02.features/places/PersonalMarksLayer'
import SearchUsers from '@/components/02.features/profile/SearchUsers'
import MapControls from '@/components/04.widgets/MapControls'

defineOptions({ name: 'HomeMapPage' })

const {
  userPosition,
  error: geolocationError,
  errorReason: geolocationErrorReason,
  isLoading: isLoadingGeolocation,
  retry: retryGeolocation,
} = useGeolocation()

const dialogStore = useDialogStore()
const authStore = useAuthStore()
const routeStore = useRouteStore()
const shareStore = useShareStore()
const notify = useNotificationStore()
const settingsStore = useSettingsStore()
const { heading } = useCompass()
const router = useRouter()
const { user, isAuthenticated } = storeToRefs(authStore)
const { markMenuStyle, showPublicMarks, showPersonalMarks, showBuildings3D, showTrees, animateWater, showWeather } = storeToRefs(settingsStore)
const menuVariant = computed(() =>
  (markMenuStyle.value === 'off')
    ? 'popover'
    : markMenuStyle.value,
)

const {
  activeMapHint,
  dismissMapHint,
  handleMarkCount,
  handleClusterCount,
  onMapReady,
} = useMapCoach()

let lastGuestNudge = 0
function nudgeGuestToLogin() {
  const now = Date.now()
  if (now - lastGuestNudge < 4000)
    return
  lastGuestNudge = now
  notify.add({
    title: 'Нужен аккаунт',
    description: 'Войдите, чтобы ставить свои метки',
    type: 'info',
    action: {
      text: 'Войти',
      callback: () => router.push('/login'),
    },
  })
}

const mapApi = shallowRef<null | Map>(null)
const markAddCoords = ref<null | MapPoint>(null)
const screenBounds = ref<MapBounds | null>(null)
const zoomLevel = ref<number>(15)

function flyToPending() {
  if (!mapApi.value || !shareStore.pendingFocus)
    return
  mapApi.value.flyTo({ center: shareStore.pendingFocus, zoom: 16 })
  shareStore.clearMapFocus()
}

function handleMapReady(map: Map) {
  mapApi.value = map
  onMapReady()
  flyToPending()
}

onActivated(flyToPending)

const markMenu = ref<{ coords: MapPoint, x: number, y: number } | null>(null)

function openMarkForm(coordinates: MapPoint) {
  markAddCoords.value = coordinates
  dialogStore.open(MarkForm, {
    coords: coordinates,
  }, {
    position: 'end center',
    headerModal: false,
  })
}

function handleMapClick(coordinates: MapPoint) {
  if (!isAuthenticated.value) {
    nudgeGuestToLogin()
    return
  }

  // Экспериментальное меню выключено — сразу открываем форму
  if (markMenuStyle.value === 'off' || !mapApi.value) {
    openMarkForm(coordinates)
    return
  }

  const point = mapApi.value.project(coordinates)
  markMenu.value = { coords: coordinates, x: point.x, y: point.y }
}

function openPublicMark() {
  const coordinates = markMenu.value?.coords
  markMenu.value = null
  if (coordinates)
    openMarkForm(coordinates)
}

function handlePrivateMark() {
  const coordinates = markMenu.value?.coords
  markMenu.value = null
  if (coordinates)
    openPersonalMarkForm(coordinates)
}

function handleMenuMove(x: number, y: number) {
  if (!markMenu.value || !mapApi.value)
    return
  const { lng, lat } = mapApi.value.unproject([x, y])
  markMenu.value.coords = [lng, lat]
}

function handleUpdateBounds(bounds: MapBounds) {
  screenBounds.value = bounds
}

function handleUpdateZoom(newZoom: number) {
  zoomLevel.value = newZoom
}

const LAST_CENTER_KEY = 'rtm_last_center'
const DEFAULT_CENTER: MapPoint = [37.6173, 55.7558]

function readLastCenter(): MapPoint | null {
  try {
    const raw = localStorage.getItem(LAST_CENTER_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length === 2
      && typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
      return [parsed[0], parsed[1]]
    }
  }
  catch {}
  return null
}

const mapInitialCenter = shallowRef<MapPoint>(readLastCenter() ?? DEFAULT_CENTER)

let centeredOnUser = false
watch(userPosition, (pos) => {
  if (!pos)
    return
  try {
    localStorage.setItem(LAST_CENTER_KEY, JSON.stringify(pos))
  }
  catch { }
  if (!centeredOnUser && !shareStore.pendingFocus) {
    centeredOnUser = true
    mapApi.value?.flyTo({ center: pos, zoom: mapApi.value.getZoom() })
  }
}, { immediate: true })
</script>

<template>
  <div
    class="column items-stretch"
    style="height: 100dvh;"
  >
    <geolocation-feedback
      v-if="geolocationError && !userPosition"
      :is-loading="isLoadingGeolocation"
      :error="geolocationError"
      :error-reason="geolocationErrorReason"
      class="absolute-center"
      @retry="retryGeolocation"
    />
    <base-map-view
      v-if="mapInitialCenter"
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
        v-if="showPublicMarks && userPosition"
        :user-coordinates="userPosition"
        :screen-bounds="screenBounds"
        :zoom-level="zoomLevel"
        @update:mark-count="handleMarkCount"
        @update:cluster-count="handleClusterCount"
      />
      <personal-marks-layer v-if="showPersonalMarks" />
      <buildings3-d v-if="showBuildings3D" />
      <map-trees v-if="showTrees" />
      <map-sky />
      <map-seasons />
      <map-water v-if="animateWater" />
      <landmarks-layer />
      <heading-cone
        v-if="userPosition && heading !== null"
        :coordinates="userPosition"
        :heading="heading"
      />
      <u-marker
        v-if="userPosition"
        :coordinates="userPosition"
        :draggable="false"
        variant="user"
        :media="user?.avatar || null"
      />
    </base-map-view>
    <search-users v-if="mapInitialCenter" />
    <weather-chip
      v-if="showWeather"
      :user-coordinates="userPosition"
    />
    <nearby-marks
      v-if="showPublicMarks"
      :user-coordinates="userPosition"
    />
    <route-banner v-if="routeStore.hasRoute" />
    <map-controls
      :map-api="mapApi"
      :user-position="userPosition"
      :zoom="zoomLevel"
    />

    <mark-create-menu
      v-if="markMenu && markMenuStyle !== 'off'"
      :variant="menuVariant"
      :x="markMenu.x"
      :y="markMenu.y"
      :coords="markMenu.coords"
      @public="openPublicMark"
      @private="handlePrivateMark"
      @move="handleMenuMove"
      @close="markMenu = null"
    />

    <transition name="coach-fade">
      <coach-hint
        v-if="activeMapHint"
        :text="activeMapHint.text"
        :icon="activeMapHint.icon"
        @close="dismissMapHint"
      />
    </transition>
  </div>
</template>
