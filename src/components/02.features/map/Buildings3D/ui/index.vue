<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { LAYER_ID as LANDMARKS_LAYER_ID } from '@/components/02.features/map/LandmarksLayer/model/useThreeLandmarks'
import {
  BUILDINGS_HEIGHT,
  BUILDINGS_LAYER_ID,
  BUILDINGS_OPACITY,
  createBuildingsLayer,
} from '../model/useBuildingsLayer'

const RISE_DURATION = 800

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { resolvedTheme } = storeToRefs(useSettingsStore())

/** Анимация появления: высота вырастает из земли, слой проявляется. */
function animateAppearance(instance: maplibregl.Map) {
  if (!instance.getLayer(BUILDINGS_LAYER_ID))
    return
  instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-height-transition', { duration: RISE_DURATION })
  instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-opacity-transition', { duration: RISE_DURATION })
  instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-height', 0)
  instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-opacity', 0)
  requestAnimationFrame(() => {
    if (!instance.getLayer(BUILDINGS_LAYER_ID))
      return
    instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-height', BUILDINGS_HEIGHT)
    instance.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-opacity', BUILDINGS_OPACITY)
  })
}

function addLayer(instance: maplibregl.Map) {
  if (instance.getLayer(BUILDINGS_LAYER_ID))
    return
  // Слой достопримечательностей (если уже добавлен) держим НАД зданиями.
  const beforeId = instance.getLayer(LANDMARKS_LAYER_ID) ? LANDMARKS_LAYER_ID : undefined
  instance.addLayer(createBuildingsLayer(themeBase(resolvedTheme.value)), beforeId)
  animateAppearance(instance)
}

function removeLayer(instance: maplibregl.Map) {
  if (instance.getLayer(BUILDINGS_LAYER_ID))
    instance.removeLayer(BUILDINGS_LAYER_ID)
}

function attach(instance: maplibregl.Map) {
  if (instance.isStyleLoaded())
    addLayer(instance)
  // style.load повторно срабатывает при смене темы (setStyle) — переустанавливаем слой.
  instance.on('style.load', () => addLayer(instance))
}

watch(
  () => map?.value,
  (instance) => {
    if (instance)
      attach(instance)
  },
  { immediate: true },
)

onUnmounted(() => {
  if (map?.value)
    removeLayer(map.value)
})
</script>

<template>
  <slot />
</template>
