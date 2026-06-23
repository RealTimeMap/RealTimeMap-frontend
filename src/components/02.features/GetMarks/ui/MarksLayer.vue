<script setup lang="ts">
import type { MapBounds, MapPoint } from '@/types/shared/map'
import { useDebounceFn } from '@vueuse/core'
import MarkDetailsSheet from '@/components/02.features/MarkDetailSheet'
import { useDialogStore } from '@/shared/stores/dialog'
import { useMarksSocket } from '../composables/useMarksSocket'

const props = defineProps<{
  userCoordinates: MapPoint
  screenBounds: MapBounds | null
  zoomLevel: number
}>()

const dialogStore = useDialogStore()
const { marks, clusters, fetchMarks } = useMarksSocket()
const router = useRouter()
const route = useRoute()

const debounceFetchMark = useDebounceFn((
  userCoordinates: MapPoint,
  screenBounds: MapBounds | null,
  zoomLevel: number,
) => {
  if (!screenBounds || !userCoordinates)
    return

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
      position: 'flex-end',
      onClose: () => {
        const currentQuery = { ...route.query }
        delete currentQuery.id
        router.replace({ query: currentQuery })
      },
    },
  )
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
  <u-marker
    v-for="mark in marks"
    :key="mark.id"
    :coordinates="mark.geom.coordinates as MapPoint"
    :draggable="false"
    :title="mark.markName"
    :media="mark.photos ? mark.photos[0] : null"
    @click="handleMarkClick(mark.id)"
  />

  <u-cluster
    v-for="cluster in clusters"
    :key="cluster.count"
    :coordinates="cluster.center.coordinates as MapPoint"
    :count="cluster.count"
  />
</template>
