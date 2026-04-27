<script setup lang="ts">
import type { LngLat, LngLatBounds } from '@yandex/ymaps3-types'
import { useDebounceFn } from '@vueuse/core'
import MarkDetailsSheet from '@/components/02.features/MarkDetailSheet'
import { useDialogStore } from '@/shared/stores/dialog'
import { useMarksSocket } from '../composables/useMarksSocket'

const props = defineProps<{
  userCoordinates: LngLat
  screenBounds: LngLatBounds | null
  zoomLevel: number
}>()

const dialogStore = useDialogStore()
const { marks, clusters, fetchMarks } = useMarksSocket()

const debounceFetchMark = useDebounceFn((
  userCoordinates: LngLat,
  screenBounds: LngLatBounds | null,
  zoomLevel: number,
) => {
  if (!screenBounds || !userCoordinates)
    return

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [longitude, latitude] = userCoordinates

  fetchMarks({
    startAt: yesterday.toISOString(),
    endAt: new Date().toISOString(),
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

function handleMarkClick(markId: number) {
  dialogStore.open(
    MarkDetailsSheet,
    { markId },
    {
      headerModal: false,
      position: 'flex-end',
    },
  )
}
</script>

<template>
  <u-marker
    v-for="mark in marks"
    :key="mark.id"
    :coordinates="mark.geom.coordinates as LngLat"
    :draggable="false"
    :title="mark.markName"
    :media="mark.photos ? mark.photos[0] : null"
    :color="mark.category.color"
    @click="handleMarkClick(mark.id)"
  />

  <u-cluster
    v-for="cluster in clusters"
    :key="cluster.count"
    :coordinates="cluster.center.coordinates as LngLat"
    :count="cluster.count"
  />
</template>
