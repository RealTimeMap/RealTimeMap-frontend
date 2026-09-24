<script setup lang="ts">
import type { Map } from 'maplibre-gl'
import type { MapPoint } from '@/types/shared/map'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useCompass } from '@/components/02.features/map/Geolocation'
import { openMapEditor } from '@/components/02.features/map/MapEditor'
import { openMapLayers } from '@/components/02.features/map/MapLayers'
import AppSettings from '@/components/04.widgets/Settings'
import { useFollowUser } from '../model/useFollowUser'
import { useMapBearing } from '../model/useMapBearing'

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

const { following, toggle: toggleFollow } = useFollowUser(() => mapApi, () => userPosition)
const compass = useCompass()

// Компас нужен только в режиме следования — датчик не держим включённым зря
function onFollowClick() {
  toggleFollow()
  if (following.value)
    compass.start()
}
watch(following, (value) => {
  if (!value)
    compass.stop()
})
onUnmounted(compass.stop)
const { bearing, isRotated, isTilted, resetNorth, togglePitch } = useMapBearing(() => mapApi)

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
          icon="app:plus"
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
          icon="app:minus"
          width="18"
        />
      </button>
    </div>

    <button
      class="map-controls__group map-controls__btn"
      :class="{ 'map-controls__btn--active': isTilted }"
      type="button"
      :aria-label="isTilted ? 'Вид сверху' : 'Вид со стороны'"
      :aria-pressed="isTilted"
      @click="togglePitch"
    >
      <span class="map-controls__pitch">{{ isTilted ? '2D' : '3D' }}</span>
    </button>

    <button
      v-if="isRotated"
      class="map-controls__group map-controls__btn"
      type="button"
      aria-label="Повернуть карту на север"
      @click="resetNorth"
    >
      <span
        class="map-controls__compass"
        :style="{ transform: `rotate(${-bearing}deg)` }"
      >
        <u-icon
          icon="app:compass-loop"
          :loop="false"
          width="20"
        />
      </span>
    </button>

    <button
      v-if="showMapLocate && userPosition"
      class="map-controls__group map-controls__btn"
      :class="{ 'map-controls__btn--active': following }"
      type="button"
      :aria-label="following ? 'Перестать следовать за мной' : 'Следовать за мной'"
      :aria-pressed="following"
      @click="onFollowClick"
    >
      <u-icon
        icon="app:locate-loop"
        :loop="following"
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
        icon="app:settings"
        width="18"
      />
    </button>

    <button
      class="map-controls__group map-controls__btn"
      type="button"
      aria-label="Слои"
      @click="openMapLayers()"
    >
      <u-icon
        icon="app:layers-loop"
        :loop="false"
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
        icon="app:edit"
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
  bottom: calc(300px + var(--safe-bottom));
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &__group {
    background: var(--bg-block-solid, var(--bg-color-block));
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

    &--active {
      color: var(--primary-color);
    }
  }

  &__compass {
    display: grid;
    place-items: center;
  }

  &__pitch {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.3px;
    font-variant-numeric: tabular-nums;
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
