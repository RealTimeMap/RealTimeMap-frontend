<script setup lang="ts">
import type { LngLat } from '@yandex/ymaps3-types'
import { useDebounceFn } from '@vueuse/core'
import MarkDetailsSheet from '@/components/02.features/MarkDetailSheet'
import { useDialogStore } from '@/shared/stores/dialog'
import { useMarksSocket } from '../composables/useMarksSocket'

const props = defineProps<{
  coordinates: LngLat
}>()

const dialogStore = useDialogStore()
const { marks, fetchMarks } = useMarksSocket()

const debounceFetchMark = useDebounceFn((coordinates: LngLat) => {
  const [longitude, latitude] = coordinates
  fetchMarks({
    show_ended: false,
    longitude,
    latitude,
    radius: 100000,
  })
}, 500)

watch(
  () => props.coordinates,
  (newCord) => {
    if (newCord)
      debounceFetchMark(newCord)
  },
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
    :media="{
      photoUrl: mark.photo ? mark.photo[0] : mark.category.icon,
    }"
    :color="mark.category.color"
    @click="handleMarkClick(mark.id)"
  />
</template>
