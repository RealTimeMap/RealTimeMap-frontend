<script setup lang="ts">
import type { Map } from 'maplibre-gl'
import type { MapBounds, MapPoint } from '@/types/shared/map'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import { GeolocationFeedback } from '@/components/02.features/Geolocation'
import { useGeolocation } from '@/components/02.features/Geolocation/model/useGeolocation'
import MarksLayer from '@/components/02.features/GetMarks/ui/MarksLayer.vue'
import LocateButton from '@/components/02.features/LocateButton'
import { BaseMapView } from '@/components/02.features/MapCore'
import MarkForm from '@/components/02.features/MarkForm'
import { useCoachmarks } from '@/components/02.features/Onboarding/model/useCoachmarks'
import CoachHint from '@/components/02.features/Onboarding/ui/CoachHint.vue'
import { RouteBanner, useRouteStore } from '@/components/02.features/RouteToMark'
import SearchUsers from '@/components/02.features/SearchUsers'

defineOptions({ name: 'HomeMapPage' })

const {
  userPosition,
  error: geolocationError,
  isLoading: isLoadingGeolocation,
} = useGeolocation()

const dialogStore = useDialogStore()
const authStore = useAuthStore()
const routeStore = useRouteStore()
const notify = useNotificationStore()
const router = useRouter()
const { user, isAuthenticated } = storeToRefs(authStore)

const { shouldShow, markSeen } = useCoachmarks()

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

const MAP_TIP_ID = 'guest_map_tap'
const mapTipVisible = ref(false)
const visibleMarksCount = ref(0)
let mapTipTimer: ReturnType<typeof setTimeout> | null = null

const mapTipText = computed(() =>
  visibleMarksCount.value > 0
    ? 'Вокруг — метки людей 👀 Откройте любую, чтобы узнать о месте'
    : 'Поблизости пусто — отдалите карту, чтобы увидеть места',
)

function dismissMapTip() {
  if (!mapTipVisible.value)
    return
  mapTipVisible.value = false
  if (mapTipTimer) {
    clearTimeout(mapTipTimer)
    mapTipTimer = null
  }
  markSeen(MAP_TIP_ID)
}

async function maybeShowMapTip() {
  if (isAuthenticated.value)
    return
  if (!(await shouldShow(MAP_TIP_ID)))
    return
  mapTipVisible.value = true
}

function handleVisibleCount(count: number) {
  visibleMarksCount.value = count
}

watch(() => dialogStore.dialogs.length, (next, prev) => {
  if (next > prev)
    dismissMapTip()
})

onDeactivated(dismissMapTip)

function handleMapReady(map: Map) {
  mapApi.value = map
  maybeShowMapTip()
}

function handleMapClick(coordinates: MapPoint) {
  if (!isAuthenticated.value) {
    nudgeGuestToLogin()
    return
  }
  markAddCoords.value = coordinates
  dialogStore.open(MarkForm, {
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
        @update:visible-count="handleVisibleCount"
      />
      <u-marker
        :coordinates="userPosition"
        :draggable="false"
        variant="user"
        :media="user?.avatar || null"
      />
    </base-map-view>
    <search-users
      v-if="!isLoadingGeolocation && !geolocationError"
    />
    <route-banner v-if="routeStore.hasRoute" />
    <locate-button
      :user-position="userPosition"
      :map-api="mapApi"
    />

    <coach-hint
      v-if="mapTipVisible"
      :text="mapTipText"
      icon="solar:map-point-wave-bold-duotone"
      @close="dismissMapTip"
    />
  </div>
</template>
