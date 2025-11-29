<script setup lang="ts">
import type { MarkAddPayload } from '@/utils/mark/index.type'
import { useAddMarkStore } from '@/shared/stores/add-mark'
import { useDialogStore } from '@/shared/stores/dialog'
import { markApi } from '@/utils/mark'

const addMarkStore = useAddMarkStore()

const markName = ref('')
const additionalInfo = ref('')
const { closeDialog } = useDialogStore()
const error = ref('')

// TODO: Implement actual API call
function handleSubmit() {
  if (!addMarkStore.markerCoords)
    return

  const payload: MarkAddPayload = {
    mark_name: markName.value,
    additional_info: additionalInfo.value,
    latitude: addMarkStore.markerCoords?.[1],
    longitude: addMarkStore.markerCoords?.[0],
    duration: 12,
    category_id: 1,
  }

  if (!payload.mark_name) {
    error.value = 'Введите название метки'
    return
  }

  markApi.postMarkAdd(payload)

  addMarkStore.stopAddingMark()
  closeDialog()
}

function handleClose() {
  addMarkStore.stopAddingMark()
  closeDialog()
}
</script>

<template>
  <div
    class="mark-form"
  >
    <u-input
      v-model="markName"
      label="Название метки"
      :error="!!error"
      :error-message="error"
    />
    <u-input
      v-model="additionalInfo"
      label="Дополнительная информация"
      placeholder="Описание, детали, контакты"
      type="textarea"
    />
    <!-- TODO: Add fields for photo, category etc. -->

    <div class="form-actions">
      <button
        type="button"
        class="cancel-btn"
        @click="handleClose"
      >
        Отмена
      </button>
      <button
        class="submit-btn"
        @click="handleSubmit"
      >
        Отправить
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mark-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn {
    background-color: #f0f0f0;
    color: #333;

    &:hover {
      background-color: #e0e0e0;
    }
  }

  .submit-btn {
    background-color: var(--primary-color);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
