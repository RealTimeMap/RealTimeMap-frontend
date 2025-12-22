<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui'
import type { MarkAddPayload, MarkCreateResponse } from '@/utils/mark/index.type'
import { NDatePicker, NSelect, NThing, NUpload, useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useAddMarkStore } from '@/shared/stores/add-mark'
import { useDialogStore } from '@/shared/stores/dialog'
import { markApi } from '@/utils/mark'

// --- Stores & Hooks ---
const addMarkStore = useAddMarkStore()
const { closeDialog } = useDialogStore()
const message = useMessage()

// --- State ---
const markName = ref('')
const additionalInfo = ref('')
const start_at = ref<number | null>(null)

const selectedCategoryId = ref<number | null>(null)
const selectedDuration = ref<MarkAddPayload['duration'] | null>(null)
const fileList = ref<UploadFileInfo[]>([])

const markCreateData = ref<MarkCreateResponse>()
const isLoadingData = ref(false)
const isSubmitting = ref(false)

// --- Computed Options для NSelect ---
const categoryOptions = computed(() => {
  return markCreateData.value?.allowed_category.map(cat => ({
    label: cat.category_name,
    value: cat.id,
  })) || []
})

const durationOptions = computed(() => {
  return markCreateData.value?.allowed_duration.map(dur => ({
    label: `${dur} ч.`,
    value: dur,
  })) || []
})

// --- API ---
async function fetchCreateData() {
  try {
    isLoadingData.value = true
    const response = await markApi.getMarkCreate()
    markCreateData.value = response

    if (response.allowed_duration.length > 0) {
      selectedDuration.value = response.allowed_duration[0] as MarkAddPayload['duration']
    }
  }
  catch (err) {
    console.error('Error fetching mark creation data:', err)
    message.error('Не удалось загрузить списки категорий')
  }
  finally {
    isLoadingData.value = false
  }
}

onMounted(() => {
  fetchCreateData()
})

// --- Handlers ---
async function handleSubmit() {
  if (!addMarkStore.markerCoords) {
    message.error('Координаты метки не найдены')
    return
  }

  if (!markName.value) {
    message.warning('Пожалуйста, введите название метки')
    return
  }
  if (!selectedCategoryId.value) {
    message.warning('Пожалуйста, выберите категорию')
    return
  }
  if (!selectedDuration.value) {
    message.warning('Пожалуйста, выберите длительность')
    return
  }

  try {
    isSubmitting.value = true

    const formData = new FormData()

    formData.append('mark_name', markName.value)
    formData.append('latitude', String(addMarkStore.markerCoords[1]))
    formData.append('longitude', String(addMarkStore.markerCoords[0]))
    formData.append('category_id', String(selectedCategoryId.value))
    formData.append('duration', String(selectedDuration.value))

    if (additionalInfo.value) {
      formData.append('additional_info', additionalInfo.value)
    }

    if (start_at.value) {
      formData.append('start_at', new Date(start_at.value).toISOString())
    }

    fileList.value.forEach((fileItem) => {
      if (fileItem.file) {
        formData.append('photo', fileItem.file)
      }
    })

    await markApi.postMarkAdd(formData as any)

    message.success('Метка успешно создана')
    addMarkStore.stopAddingMark()
    closeDialog()
  }
  catch (e) {
    console.error(e)
    message.error('Ошибка при создании метки')
  }
  finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  addMarkStore.stopAddingMark()
  closeDialog()
}
</script>

<template>
  <div class="mark-form">
    <n-thing class="select-thing">
      <template #header>
        Фото
      </template>
      <template #description>
        <n-upload
          v-model:file-list="fileList"
          :max="4"
          :default-upload="false"
          accept="image/*"
          directory-dnd
          list-type="image-card"
          class="upload-area"
        >
          <div class="upload-text">
            Загрузить фото
          </div>
        </n-upload>
      </template>
    </n-thing>

    <u-input
      v-model="markName"
      label="Название метки"
    />

    <u-input
      v-model="additionalInfo"
      label="Дополнительная информация"
      placeholder="Описание, детали, контакты"
      type="textarea"
    />

    <div class="form-item">
      <span class="label">Время начала</span>
      <n-date-picker
        v-model:value="start_at"
        type="datetime"
        placeholder="Выберите дату и время"
        format="dd.MM.yyyy HH:mm"
        clearable
        class="full-width"
      />
    </div>

    <n-thing class="select-thing">
      <template #header>
        Категория
      </template>
      <template #header-extra>
        <n-select
          v-model:value="selectedCategoryId"
          :options="categoryOptions"
          :loading="isLoadingData"
          placeholder="Выберите категорию"
          class="custom-select"
          size="small"
        />
      </template>
    </n-thing>

    <n-thing class="select-thing">
      <template #header>
        Длительность
      </template>
      <template #header-extra>
        <n-select
          v-model:value="selectedDuration"
          :options="durationOptions"
          :loading="isLoadingData"
          placeholder="Время действия"
          class="custom-select"
          size="small"
        />
      </template>
    </n-thing>

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
        {{ isSubmitting ? 'Отправка...' : 'Создать' }}
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

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }
}

.full-width {
  width: 100%;
}

.select-thing {
  padding: 8px;
  border-radius: 6px;
}

.custom-select {
  width: 180px;
}

.upload-text {
  font-size: 12px;
  color: #666;
  padding: 10px;
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
    font-size: 14px;
    font-weight: 600;
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
    background-color: var(--primary-color, #18a058);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
