<script setup lang="ts">
import type { LngLat } from '@yandex/ymaps3-types'
import MarkForm from '@/components/02.features/mark-form'
import { useDialogStore } from '@/shared/stores/dialog'
import UMarker from '../../../01.kit/UMarker/ui/u-marker.vue'
import { useAddMarkStore } from '../../../../shared/stores/add-mark'

const addMarkStore = useAddMarkStore()
const { openDialog } = useDialogStore()

function onDragEnd(newCoords: LngLat) {
  addMarkStore.setMarkerCoords(newCoords)
}

function onNextClick() {
  openDialog(MarkForm, {}, 'Добавить новую метку')
}
</script>

<template>
  <div
    v-if="addMarkStore.isAddingMark && addMarkStore.markerCoords"
    class="add-mark-mode"
  >
    <u-marker
      :coordinates="addMarkStore.markerCoords"
      draggable
      :media="{}"
      @dragend="onDragEnd"
    />

    <teleport to=".n-config-provider">
      <button
        class="next-button"
        @click="onNextClick"
      >
        Далее
      </button>
    </teleport>
  </div>
</template>

<style scoped lang="scss">
.add-mark-mode {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.next-button {
  position: fixed;
  bottom: 40px;
  right: 20px;
  padding: 12px 24px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
