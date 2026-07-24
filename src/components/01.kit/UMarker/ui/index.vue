<script setup lang="ts">
import type { ShallowRef } from 'vue'
import type { MapPoint } from '@/types/shared/map'
import * as maplibregl from 'maplibre-gl'

interface Props {
  coordinates: MapPoint
  draggable?: boolean
  color?: string
  media?: string | null
}

const {
  coordinates,
  draggable = false,
  color = '#fff',
  media = null,
} = defineProps<Props>()

const emit = defineEmits<{ click: [] }>()

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const marker = shallowRef<maplibregl.Marker | null>(null)

const el = document.createElement('div')
const isReady = ref(false)

onMounted(() => {
  if (!map?.value)
    return

  marker.value = new maplibregl.Marker({
    element: el,
    draggable,
    anchor: 'bottom',
  })
    .setLngLat(coordinates)
    .addTo(map.value)

  isReady.value = true
})

watch(() => coordinates, (newCoords) => {
  marker.value?.setLngLat(newCoords)
})

onUnmounted(() => {
  marker.value?.remove()
  marker.value = null
})
</script>

<template>
  <div style="display: none;" />

  <teleport
    v-if="isReady"
    :to="el"
  >
    <div
      class="custom-map-marker"
      :class="{ draggable }"
      @click="emit('click')"
    >
      <template v-if="media">
        <div class="marker__block">
          <img
            :src="media"
            class="marker-photo"
            :style="{ borderColor: color }"
            alt="photo"
          >
        </div>
      </template>
      <div
        v-else
        class="marker-icon"
      />
      <div class="marker-pulse" />
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.custom-map-marker {
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
}
.draggable {
  cursor: grab;
}
.marker__block {
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border: 6px solid transparent;
    border-top-color: #3399ff;
    z-index: 1;
  }
}
.marker-photo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #3399ff;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 6px 14px;
  background-color: white;
  position: relative;
  z-index: 2;
}
.marker-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(145deg, #66ccff, #0066cc);
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}
.marker-pulse {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: rgba(0, 153, 255, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
</style>
