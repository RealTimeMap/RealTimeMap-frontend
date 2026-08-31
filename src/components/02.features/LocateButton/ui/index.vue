<script setup lang="ts">
import type { Map } from 'maplibre-gl'
import type { MapPoint } from '@/types/shared/map'

const { userPosition, mapApi } = defineProps<{
  userPosition: MapPoint | null
  mapApi: Map | null
}>()

function centerOnUser() {
  if (mapApi && userPosition) {
    mapApi.flyTo({
      center: userPosition,
      zoom: 15,
      essential: true,
    })
  }
}
</script>

<template>
  <u-glass-wrapper
    v-if="userPosition"
    class="locate-button"
    :scale="40"
  >
    <button
      @click="centerOnUser"
    >
      <u-icon
        icon="line-md:my-location"
        width="20"
        height="20"
      />
    </button>
  </u-glass-wrapper>
</template>

<style lang="scss" scoped>
.locate-button {
  --base-bottom-offset: 130px;

  position: absolute;
  right: 20px;
  bottom: calc(var(--base-bottom-offset) + env(safe-area-inset-bottom, 0px));
  width: 44px;
  height: 44px;
  border-radius: 20px;

  button {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 20px;
    svg {
      color: var(--text-color);
    }
  }
}
</style>
