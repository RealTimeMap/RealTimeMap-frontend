import type { Feature, LineString } from 'geojson'
import type { GeoJSONSource } from 'maplibre-gl'
import type { RouteProfile } from './fetchRoute'
import type { PositionWatcher } from './watchPosition'
import type { MapPoint } from '@/types/shared/map'
import { defineStore } from 'pinia'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useShareStore } from '@/components/02.features/Share/model'
import { formatDistance, formatDuration } from './distance'
import { fetchRoute } from './fetchRoute'
import { getCurrentPosition } from './getCurrentPosition'
import { hideRouteNotification, showRouteNotification } from './routeNotification'
import { watchPosition } from './watchPosition'

const REBUILD_MIN_METERS = 25
const ARRIVAL_METERS = 20

function distanceMeters(a: MapPoint, b: MapPoint): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h
    = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const PROFILE_LABELS: Record<RouteProfile, string> = {
  'foot-walking': 'пешком',
  'cycling-regular': 'на велосипеде',
  'driving-car': 'на авто',
}

const SOURCE_ID = 'route-to-mark'
const CASING_ID = 'route-to-mark-casing'
const LINE_ID = 'route-to-mark-line'

export const useRouteStore = defineStore('routeToMark', () => {
  const share = useShareStore()
  const notify = useNotificationStore()
  const settings = useSettingsStore()

  const activeMarkId = ref<number | null>(null)
  const destination = ref<MapPoint | null>(null)
  const profile = ref<RouteProfile>('foot-walking')
  const distance = ref(0)
  const duration = ref(0)
  const isBuilding = ref(false)

  // Последняя позиция, из которой строился маршрут, и активный вотчер геолокации
  const currentStart = ref<MapPoint | null>(null)
  let positionWatcher: PositionWatcher | null = null

  const hasRoute = computed(() => activeMarkId.value !== null)
  const formattedDistance = computed(() => formatDistance(distance.value))
  const formattedDuration = computed(() => formatDuration(duration.value))

  function syncNotification() {
    if (settings.isSystemNotificationsEnabled) {
      const label = PROFILE_LABELS[profile.value]
      showRouteNotification(
        `${formattedDistance.value} · ${formattedDuration.value} · ${label}`,
        formattedDuration.value,
      )
    }
    else {
      hideRouteNotification()
    }
  }

  function drawRoute(geojson: Feature<LineString>) {
    const map = share.mapInstance
    if (!map)
      return

    const existing = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(geojson)
      return
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })
    map.addLayer({
      id: LINE_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': 'rgb(169, 140, 255)', 'line-width': 5 },
    })
  }

  function fitToRoute(geojson: Feature<LineString>) {
    const map = share.mapInstance
    if (!map)
      return

    const coords = geojson.geometry.coordinates
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity
    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng)
      minLat = Math.min(minLat, lat)
      maxLng = Math.max(maxLng, lng)
      maxLat = Math.max(maxLat, lat)
    }

    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 16 })
  }

  async function run(markId: number, dest: MapPoint, fit: boolean, startOverride?: MapPoint) {
    if (isBuilding.value)
      return

    isBuilding.value = true
    try {
      const start = startOverride ?? await getCurrentPosition()
      if (!start) {
        notify.add({ title: 'Не удалось определить ваше местоположение', type: 'error' })
        return
      }

      const route = await fetchRoute(start, dest, profile.value)
      drawRoute(route.geojson)
      if (fit)
        fitToRoute(route.geojson)

      currentStart.value = start
      distance.value = route.distance
      duration.value = route.duration
      activeMarkId.value = markId
      destination.value = dest
      syncNotification()
    }
    catch {
      notify.add({ title: 'Не удалось построить маршрут', type: 'error' })
    }
    finally {
      isBuilding.value = false
    }
  }

  function stopWatching() {
    positionWatcher?.clear()
    positionWatcher = null
  }

  function clearRoute() {
    const map = share.mapInstance
    if (map) {
      if (map.getLayer(LINE_ID))
        map.removeLayer(LINE_ID)
      if (map.getLayer(CASING_ID))
        map.removeLayer(CASING_ID)
      if (map.getSource(SOURCE_ID))
        map.removeSource(SOURCE_ID)
    }

    stopWatching()
    activeMarkId.value = null
    destination.value = null
    currentStart.value = null
    distance.value = 0
    duration.value = 0
    hideRouteNotification()
  }

  function onPositionUpdate(pos: MapPoint) {
    if (activeMarkId.value === null || !destination.value || isBuilding.value)
      return

    if (distanceMeters(pos, destination.value) <= ARRIVAL_METERS) {
      notify.add({ title: 'Вы на месте', type: 'success' })
      clearRoute()
      return
    }

    if (currentStart.value && distanceMeters(currentStart.value, pos) < REBUILD_MIN_METERS)
      return

    run(activeMarkId.value, destination.value, false, pos)
  }

  async function startWatching() {
    if (positionWatcher)
      return
    positionWatcher = await watchPosition(onPositionUpdate)
  }

  async function buildRoute(markId: number, dest: MapPoint) {
    await run(markId, dest, true)
    if (activeMarkId.value !== null)
      startWatching()
  }

  function setProfile(next: RouteProfile) {
    if (profile.value === next)
      return
    profile.value = next
    if (activeMarkId.value !== null && destination.value)
      run(activeMarkId.value, destination.value, false, currentStart.value ?? undefined)
  }

  return {
    activeMarkId,
    profile,
    hasRoute,
    isBuilding,
    formattedDistance,
    formattedDuration,
    buildRoute,
    setProfile,
    clearRoute,
  }
})
