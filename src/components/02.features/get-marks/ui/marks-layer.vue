<script setup lang="ts">
import type { LngLat } from '@yandex/ymaps3-types'
import { useDebounceFn } from '@vueuse/core'
import { useMarksSocket } from '../composables/useMarksSocket'

const props = defineProps<{
  coordinates: LngLat
}>()

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
</script>

<template>
  <UMarker
    v-for="mark in marks"
    :key="mark.id"
    :coordinates="mark.geom.coordinates as LngLat"
    :draggable="false"
    :title="mark.mark_name"
    :media="{
      photoUrl: mark.photo ? mark.photo[0] : mark.category.icon,
    }"
  />
</template>
