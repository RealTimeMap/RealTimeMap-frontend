<script setup lang="ts">
import type { Map } from 'maplibre-gl'
import type { MapPoint } from '@/types/shared/map'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import AppSettings from '@/components/02.features/AppSetting'
import { openMapEditor } from '@/components/02.features/MapEditor'

const { mapApi, userPosition, zoom } = defineProps<{
  mapApi: Map | null
  userPosition: MapPoint | null
  zoom: number
}>()

const { open } = useDialogStore()
const { showMapZoom, showMapLocate, showMapSettings, showMapZoomLevel } = storeToRefs(useSettingsStore())

function zoomIn() {
  mapApi?.zoomIn()
}

function zoomOut() {
  mapApi?.zoomOut()
}

function locate() {
  if (mapApi && userPosition) {
    mapApi.flyTo({ center: userPosition, zoom: 15, essential: true })
  }
}

function openSettings() {
  open(AppSettings, {}, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
</script>

<template>
  <div class="map-controls">
    <div
      v-if="showMapZoom"
      class="map-controls__group"
    >
      <button
        class="map-controls__btn"
        type="button"
        aria-label="Приблизить"
        @click="zoomIn"
      >
        <u-icon
          icon="lucide:plus"
          width="18"
        />
      </button>
      <div class="map-controls__divider" />
      <button
        class="map-controls__btn"
        type="button"
        aria-label="Отдалить"
        @click="zoomOut"
      >
        <u-icon
          icon="lucide:minus"
          width="18"
        />
      </button>
    </div>

    <button
      v-if="showMapLocate && userPosition"
      class="map-controls__group map-controls__btn"
      type="button"
      aria-label="Моё местоположение"
      @click="locate"
    >
      <u-icon
        icon="line-md:my-location"
        width="18"
      />
    </button>

    <button
      v-if="showMapSettings"
      class="map-controls__group map-controls__btn"
      type="button"
      aria-label="Настройки"
      @click="openSettings"
    >
      <u-icon
        icon="solar:settings-bold"
        width="18"
      />
    </button>

    <button
      class="map-controls__group map-controls__btn"
      type="button"
      aria-label="Редактор карты"
      @click="openMapEditor('sheet')"
    >
      <u-icon
        icon="solar:pen-2-bold"
        width="18"
      />
    </button>

    <div
      v-if="showMapZoomLevel"
      class="map-controls__group map-controls__zoom"
    >
      <span class="map-controls__zoom-value">{{ Math.round(zoom) }}</span>
      <span class="map-controls__zoom-label">ZOOM</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-controls {
  position: absolute;
  right: 14px;
  bottom: calc(200px + var(--safe-bottom));
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &__group {
    background: var(--bg-block-solid, var(--bg-color-block));
    border: 0.5px solid var(--glass-border);
    border-radius: 16px;
    box-shadow:
      var(--glass-shadow-inset) 0px 1px 0px inset,
      var(--glass-shadow) 0px 10px 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
  }

  &__btn {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    transition: transform 0.12s ease;

    &:active {
      transform: scale(0.9);
    }
  }

  &__divider {
    width: 60%;
    height: 1px;
    background: var(--border-subtle);
  }

  &__zoom {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    gap: 1px;
  }

  &__zoom-value {
    @include value-text(13px, var(--text-color), 800);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__zoom-label {
    @include label-text(8px, uppercase);
    letter-spacing: 1px;
  }
}
</style>
