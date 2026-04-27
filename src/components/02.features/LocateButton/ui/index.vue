<script setup lang="ts">
import type { LngLat, YMap } from '@yandex/ymaps3-types'

const { userPosition, mapApi } = defineProps<{
  userPosition: LngLat | null
  mapApi: YMap | null
}>()

function centerOnUser() {
  if (mapApi && userPosition) {
    mapApi.setLocation({
      center: userPosition,
      zoom: 15,
      duration: 400,
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
  position: absolute;
  right: 20px;
  bottom: 160px;
  backdrop-filter: blur(38.4px) saturate(180%);
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
      color: white;
    }
  }
}
</style>
