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
  <button
    v-if="userPosition"
    class="locate-button"
    @click="centerOnUser"
  >
    <u-icon
      icon="line-md:my-location"
      width="20"
      height="20"
    />
  </button>
</template>

<style lang="scss" scoped>
.locate-button {
  position: absolute;
  right: 20px;
  bottom: 120px;

  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(38.4px) saturate(180%);
  background: rgba(18, 24, 38, 0.45);
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    rgba(255, 255, 255, 0.06) 0px 1px 0px inset,
    rgba(0, 0, 0, 0.35) 0px 10px 30px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: white;
  }
}
</style>
