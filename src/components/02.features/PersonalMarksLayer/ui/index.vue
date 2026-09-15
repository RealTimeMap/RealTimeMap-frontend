<script setup lang="ts">
import type { MapPoint } from '@/types/shared/map'
import { storeToRefs } from 'pinia'
import { usePlacesStore } from '@/components/00.shared/stores/places'
import { openPersonalMarkDetail } from '@/components/02.features/PersonalMarkDetail'

const store = usePlacesStore()
const { visibleMarks } = storeToRefs(store)

onMounted(() => store.hydrate())
</script>

<template>
  <div class="personal-markers-overlay">
    <u-marker
      v-for="mark in visibleMarks"
      :key="String(mark.id)"
      v-memo="[mark.coordinates, mark.icon, mark.color]"
      :coordinates="mark.coordinates as MapPoint"
      variant="personal"
      :icon="mark.icon || 'solar:map-point-linear'"
      :color="mark.color || 'var(--primary-color)'"
      @click="openPersonalMarkDetail(mark.id)"
    />
  </div>
</template>
