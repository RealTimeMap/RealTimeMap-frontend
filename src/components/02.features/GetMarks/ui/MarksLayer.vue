<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { Mark } from '@/components/00.shared/services/mark/index.type'
import type { MapBounds, MapPoint } from '@/types/shared/map'
import { useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import MarkDetailsSheet from '@/components/02.features/MarkDetailSheet'
import { useRouteStore } from '@/components/02.features/RouteToMark'
import { useMarksSocket } from '../model/useMarksSocket'

const props = defineProps<{
  userCoordinates: MapPoint
  screenBounds: MapBounds | null
  zoomLevel: number
}>()

const CLUSTER_ZOOM_STEP = 2
const CLUSTER_MAX_ZOOM = 18

const dialogStore = useDialogStore()
const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { marks, clusters, fetchMarks } = useMarksSocket()

const { pinnedMark } = storeToRefs(useRouteStore())

const displayMarks = computed<Mark[]>(() => {
  const base = [...marks.value] as Mark[]
  const pin = pinnedMark.value
  if (!pin || base.some(m => m.id === pin.id))
    return base
  return [...base, pin]
})
const router = useRouter()
const route = useRoute()

let lastFetchKey = ''
const isActive = ref(true)
onActivated(() => {
  isActive.value = true
})
onDeactivated(() => {
  isActive.value = false
})

const debounceFetchMark = useDebounceFn((
  userCoordinates: MapPoint,
  screenBounds: MapBounds | null,
  zoomLevel: number,
) => {
  if (!screenBounds || !userCoordinates)
    return

  const fetchKey = [
    userCoordinates[0].toFixed(4),
    userCoordinates[1].toFixed(4),
    screenBounds[0][0].toFixed(4),
    screenBounds[0][1].toFixed(4),
    screenBounds[1][0].toFixed(4),
    screenBounds[1][1].toFixed(4),
    zoomLevel.toFixed(2),
  ].join('_')

  if (fetchKey === lastFetchKey)
    return
  lastFetchKey = fetchKey

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [longitude, latitude] = userCoordinates

  fetchMarks({
    startAt: new Date().toISOString(),
    // endAt: new Date().toISOString(),
    zoomLevel,
    screen: {
      leftTop: {
        lat: screenBounds[0][1],
        lon: screenBounds[0][0],
      },
      rightBottom: {
        lat: screenBounds[1][1],
        lon: screenBounds[1][0],
      },
      center: {
        lat: latitude,
        lon: longitude,
      },
    },
    // show_ended: false,
    // longitude,
    // latitude,
    // radius: 100000,
  })
}, 500)

watch(
  [() => props.userCoordinates, () => props.screenBounds, () => props.zoomLevel],
  ([newCord, newBounds, newZoomLevel]) => {
    if (!isActive.value)
      return
    if (newCord && newBounds && newZoomLevel)
      debounceFetchMark(newCord, newBounds, newZoomLevel)
  },
  { immediate: true },
)

function openMarkModal(markId: number) {
  dialogStore.open(
    MarkDetailsSheet,
    { markId },
    {
      headerModal: false,
      position: 'end center',
      onClose: () => {
        const currentQuery = { ...route.query }
        delete currentQuery.id
        router.replace({ query: currentQuery })
      },
    },
  )
}

function handleClusterClick(coordinates: MapPoint) {
  const instance = map?.value
  if (!instance)
    return

  instance.easeTo({
    center: coordinates,
    zoom: Math.min(instance.getZoom() + CLUSTER_ZOOM_STEP, CLUSTER_MAX_ZOOM),
    duration: 500,
  })
}

function handleMarkClick(markId: number) {
  router.replace({
    query: {
      ...route.query,
      id: markId,
    },
  })

  openMarkModal(markId)
}

onMounted(() => {
  const queryId = route.query.id
  const idString = Array.isArray(queryId) ? queryId[0] : queryId

  if (idString) {
    const markId = Number(idString)

    if (!Number.isNaN(markId)) {
      openMarkModal(markId)
    }
  }
})
</script>

<template>
  <div class="markers-overlay">
    <u-marker
      v-for="mark in displayMarks"
      :key="mark.id"
      v-memo="[mark.geom.coordinates, mark.photos?.[0]]"
      :coordinates="mark.geom.coordinates as MapPoint"
      :media="mark.photos ? mark.photos[0] : null"
      @click="handleMarkClick(mark.id)"
    />

    <u-cluster
      v-for="cluster in clusters"
      :key="`cluster-${cluster.center.coordinates.join('-')}`"
      v-memo="[cluster.center.coordinates, cluster.count]"
      :coordinates="cluster.center.coordinates as MapPoint"
      :count="cluster.count"
      @click="handleClusterClick(cluster.center.coordinates as MapPoint)"
    />
  </div>
</template>
