<script setup lang="ts">
import type { ShallowRef } from 'vue'
import type { MapPoint } from '@/types/shared/map'
import * as maplibregl from 'maplibre-gl'

const { coordinates, heading } = defineProps<{
  coordinates: MapPoint
  heading: number
}>()

const map = inject<ShallowRef<maplibregl.Map | null>>('map')

const el = document.createElement('div')
el.className = 'heading-cone'
let marker: maplibregl.Marker | null = null

onMounted(() => {
  const instance = map?.value
  if (!instance)
    return
  // Поворот и наклон вместе с картой: конус лежит на земле и смотрит по сторонам света
  marker = new maplibregl.Marker({
    element: el,
    anchor: 'center',
    rotationAlignment: 'map',
    pitchAlignment: 'map',
    rotation: heading,
  })
    .setLngLat(coordinates)
    .addTo(instance)
  // Маркеры рисуются в порядке добавления — ставим конус первым, под меткой пользователя
  const container = instance.getCanvasContainer()
  container.insertBefore(el, instance.getCanvas().nextSibling)
})

watch(() => coordinates, value => marker?.setLngLat(value))
watch(() => heading, value => marker?.setRotation(value))

onBeforeUnmount(() => {
  marker?.remove()
  marker = null
})
</script>

<template>
  <div style="display: none;" />
</template>

<style lang="scss">
.heading-cone {
  width: 200px;
  height: 200px;
  pointer-events: none;
  // Луч из центра вверх; Marker поворачивает весь квадрат вокруг центра — точки пользователя
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in srgb, var(--primary-color) 70%, transparent) 0,
    color-mix(in srgb, var(--primary-color) 35%, transparent) 25%,
    transparent 48%
  );
  clip-path: polygon(50% 50%, 22% 0, 78% 0);
  animation: heading-cone-in 0.3s ease both;
}

@keyframes heading-cone-in {
  from {
    opacity: 0;
  }
}
</style>
