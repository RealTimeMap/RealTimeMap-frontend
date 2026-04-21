<script setup lang="ts">
import type { LngLat, LngLatBounds } from '@yandex/ymaps3-types'
import { useDebounceFn } from '@vueuse/core'
import MarkDetailsSheet from '@/components/02.features/MarkDetailSheet'
import { useDialogStore } from '@/shared/stores/dialog'
import { useMarksSocket } from '../composables/useMarksSocket'

const props = defineProps<{
  userCoordinates: LngLat
  screenBounds: LngLatBounds | null
}>()

const dialogStore = useDialogStore()
const { marks, fetchMarks } = useMarksSocket()

const debounceFetchMark = useDebounceFn((
  userCoordinates: LngLat,
  screenBounds: LngLatBounds | null,
) => {
  if (!screenBounds || !userCoordinates)
    return

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [longitude, latitude] = userCoordinates

  fetchMarks({
    startAt: yesterday.toISOString(),
    endAt: new Date().toISOString(),
    zoomLevel: 18,
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

  console.log(marks.value)
}, 500)

watch(
  [() => props.userCoordinates, () => props.screenBounds],
  ([newCord, newBounds]) => {
    if (newCord && newBounds)
      debounceFetchMark(newCord, newBounds)
  },
  { immediate: true },
)

function handleMarkClick(markId: number) {
  dialogStore.openDialog(MarkDetailsSheet, { markId }, 'Детали метки')
}
</script>

<template>
  <u-marker
    v-for="mark in marks"
    :key="mark.id"
    :coordinates="mark.geom.coordinates as LngLat"
    :draggable="false"
    :title="mark.mark_name"
    :media="mark.photo ? mark.photo[0] : null"
    :color="mark.category.color"
    @click="handleMarkClick(mark.id)"
  />
</template>
