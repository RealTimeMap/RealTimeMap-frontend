<script setup lang="ts">
import type { LngLat } from '@yandex/ymaps3-types'
import type { UploadFileInfo } from 'naive-ui'
import type { MarkAddPayload, MarkCreateResponse } from '@/utils/mark/index.type'
import { useMessage } from 'naive-ui'
import { useGeocoding } from '@/composables/useGeocoding'
import { useDialogStore } from '@/shared/stores/dialog'
import { markApi } from '@/utils/mark'

const { coords } = defineProps<{ coords: LngLat }>()
const { address, fetchAddress } = useGeocoding()

// --- Stores & Hooks ---
const { close } = useDialogStore()
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
const _categoryOptions = computed(() => {
  return markCreateData.value?.allowedCategories.map(cat => ({
    label: cat.categoryName,
    value: cat.id,
  })) || []
})

const _durationOptions = computed(() => {
  return markCreateData.value?.allowedDuration.map(dur => ({
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

    if (response.allowedDuration.length > 0) {
      selectedDuration.value = response.allowedDuration[0] as MarkAddPayload['duration']
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
  fetchAddress(coords)
})

// --- Handlers ---
async function _handleSubmit() {
  if (!coords) {
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

    formData.append('markName', markName.value)
    formData.append('latitude', String(coords[1]))
    formData.append('longitude', String(coords[0]))
    formData.append('categoryId', String(selectedCategoryId.value))
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
    close()
  }
  catch (e) {
    console.error(e)
    message.error('Ошибка при создании метки')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mark-form">
    <div class="u-block mark-form__coords-wrap">
      <u-icon
        icon="line-md:my-location-loop"
        width="22"
        height="22"
      />
      <div class="mark-form__coords">
        <span>Точка на карте</span>
        <span>{{ coords[0].toFixed(4) }}° N, {{ coords[1].toFixed(4) }}° E</span>
      </div>
    </div>

    <u-ploader
      v-model:files="fileList"
      :max="4"
      :max-size-mb="20"
    />

    <div class="u-block mark-form__content">
      <u-input
        v-model="markName"
        label="Название метки"
      />
      <u-drawer />
      <div class="mark-content__container">
        <span class="label">Адрес</span>
        <div
          class="value"
        >
          {{ address || 'Не удалось определить адрес' }}
        </div>
      </div>
      <u-drawer />
      <div class="mark-content__container">
        <span class="label">Дата</span>
        <div
          class="value"
        >
          {{ new Date().toLocaleDateString('ru-RU') }}
        </div>
      </div>
    </div>

    <!-- <u-input
      v-model="additionalInfo"
      label="Дополнительная информация"
      placeholder="Описание, детали, контакты"
      type="textarea"
    /> -->

    <!-- <div class="form-item">
      <span class="label">Время начала</span>
      <n-date-picker
        v-model:value="start_at"
        type="datetime"
        placeholder="Выберите дату и время"
        format="dd.MM.yyyy HH:mm"
        clearable
        class="full-width"
      />
    </div> -->

    <!-- <n-thing class="select-thing">
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
    </n-thing> -->

    <!-- <div class="form-actions">
      <button
        class="submit-btn"
        @click="handleSubmit"
      >
        {{ isSubmitting ? 'Отправка...' : 'Создать' }}
      </button>
    </div>
  </div> -->
  </div>
</template>

<style scoped lang="scss">
.mark-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mark-form__coords-wrap {
  gap: 22px;

  svg {
    margin-left: 10px;
    color: var(--primary-color);
  }
}

.mark-form__coords {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;

  span {
    &:first-child {
      color: var(--text-color);
      font-size: 15px;
      font-weight: 600;
    }
    &:last-child {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.55);
      font-family:
        ui-monospace,
        SF Mono,
        monospace;
      margin-top: 2px;
    }
  }
}

.mark-form__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;

  .mark-content__container {
    .label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      color: rgb(255, 255, 255);
      font-size: 15px;
    }
  }
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
