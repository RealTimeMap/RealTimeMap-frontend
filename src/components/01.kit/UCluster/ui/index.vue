<script setup lang="ts">
import type { LngLat } from '@yandex/ymaps3-types'
import { YandexMapMarker } from 'vue-yandex-maps'

interface Props {
  coordinates: LngLat
  count: number
}

const props = defineProps<Props>()

const localCoordinates = ref<LngLat>([0, 0])

watch(() => props.coordinates, (newCoords) => {
  localCoordinates.value = [...newCoords]
}, { immediate: true, deep: true })

const markerSettings = computed(() => ({
  coordinates: localCoordinates.value,
}))
</script>

<template>
  <yandex-map-marker :settings="markerSettings">
    <div class="cluster-marker">
      <div class="cluster-body">
        {{ count }}
      </div>

      <div class="pulse-ring ring-1" />
      <div class="pulse-ring ring-2" />
    </div>
  </yandex-map-marker>
</template>

<style scoped lang="scss">
.cluster-marker {
  position: relative;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
}

.cluster-body {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;

  background: var(--primary-color);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;

  color: white;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.pulse-ring {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #3399ff6e;
  border-radius: 50%;
  opacity: 0;
}

.ring-1 {
  animation: pulse 3s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

.ring-2 {
  animation: pulse 3s cubic-bezier(0.455, 0.03, 0.515, 0.955) 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.cluster-marker:hover .cluster-body {
  filter: brightness(1.1);
  transition: filter 0.2s;
}
</style>
