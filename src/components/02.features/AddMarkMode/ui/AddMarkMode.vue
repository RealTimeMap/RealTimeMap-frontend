<script setup lang="ts">
import type { LngLat } from '@yandex/ymaps3-types'
import MarkForm from '@/components/02.features/MarkForm'
import { useDialogStore } from '@/shared/stores/dialog'
import UMarker from '../../../01.kit/UMarker/ui/UMarker.vue'
import { useAddMarkStore } from '../../../../shared/stores/add-mark'

const addMarkStore = useAddMarkStore()
const { openDialog, closeDialog } = useDialogStore()

function onDragEnd(newCoords: LngLat) {
  addMarkStore.setMarkerCoords(newCoords)
}

function onNextClick() {
  openDialog(MarkForm, {}, 'Добавить новую метку')
}

function handleClose() {
  addMarkStore.stopAddingMark()
  closeDialog()
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

    <teleport to=".n-config-provider">
      <button
        class="close-button"
        @click="handleClose"
      >
        <u-icon
          icon="line-md:close-circle"
          width="30"
          height="30"
        />
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

.close-button {
  position: fixed;
  top: 20px;
  left: 20px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  color: white;
  transition: all 0.3s ease;
  pointer-events: auto;
  background-color: var(--red-color);
  border-radius: 50%;
  padding: 5px;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(1);
  }
}
</style>
