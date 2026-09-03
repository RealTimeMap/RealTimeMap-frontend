<script setup lang="ts">
import type { MapPoint } from '@/types/shared/map'
import { useCoachmarks } from '@/components/02.features/Onboarding/model/useCoachmarks'
import CoachSpotlight from '@/components/02.features/Onboarding/ui/CoachSpotlight.vue'
import { useMarkAdd } from '../model'
import DateBlock from './DateBlock.vue'
import MarkPhotoInput from './MarkPhotoInput.vue'

const props = defineProps<{ coords: MapPoint }>()
const coords = toRef(props, 'coords')

const DATE_TIP_ID = 'mark_datetime'
const dateBlockRef = ref<HTMLElement | null>(null)
const showDateTip = ref(false)
const { shouldShow, markSeen } = useCoachmarks()
let dateTipTimer: ReturnType<typeof setTimeout> | null = null

function dismissDateTip() {
  if (!showDateTip.value)
    return
  showDateTip.value = false
  if (dateTipTimer) {
    clearTimeout(dateTipTimer)
    dateTipTimer = null
  }
  markSeen(DATE_TIP_ID)
}

const {
  markName,
  additionalInfo,
  fileList,
  address,
  categoryOptions,
  selectedCategoryId,
  isSubmitting,

  startAt,
  endAt,

  handleSubmit,
  close,
  fetchCreateData,
  fetchAddress,
} = useMarkAdd(coords.value)

onMounted(async () => {
  fetchCreateData()
  fetchAddress(coords.value)

  if (await shouldShow(DATE_TIP_ID)) {
    setTimeout(() => {
      if (dateBlockRef.value) {
        showDateTip.value = true
        dateTipTimer = setTimeout(dismissDateTip, 12000)
      }
    }, 450)
  }
})

onUnmounted(dismissDateTip)
</script>

<template>
  <div class="mark-form">
    <header class="mark-form__header">
      <button
        type="button"
        class="mark-form__header-btn mark-form__header-btn--cancel"
        @click="close"
      >
        Отмена
      </button>
      <h2 class="mark-form__header-title">
        Новая метка
      </h2>
      <button
        type="button"
        class="mark-form__header-btn mark-form__header-btn--submit"
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        Готово
      </button>
    </header>

    <div class="mark-form__body">
      <div class="u-block mark-form__coords">
        <u-icon
          class="mark-form__coords-icon"
          icon="line-md:my-location-loop"
          width="22"
          height="22"
        />
        <div class="mark-form__coords-info">
          <span class="mark-form__coords-label">Точка на карте</span>
          <span class="mark-form__coords-value">
            {{ coords[0].toFixed(4) }}° N, {{ coords[1].toFixed(4) }}° E
          </span>
        </div>
      </div>

      <mark-photo-input
        v-model:files="fileList"
        :max="4"
        :max-size-mb="20"
      />

      <div class="u-block mark-form__fields">
        <u-input
          v-model="markName"
          label="Название"
          placeholder="Напр. «Двор на Патриарших»"
        />
        <u-drawer />
        <div class="mark-form__field">
          <span class="label-text">Адрес</span>
          <div class="value-text mark-form__value--address">
            {{ address || 'Не удалось определить адрес' }}
          </div>
        </div>
        <u-drawer />

        <u-select
          v-model="selectedCategoryId"
          label="Категория"
          :options="categoryOptions"
          :parent-padding="14"
        />
      </div>

      <div ref="dateBlockRef">
        <date-block
          v-model:start-at="startAt"
          v-model:end-at="endAt"
        />
      </div>

      <u-text-area
        v-model="additionalInfo"
        label="Описание"
        placeholder="История этого места, воспоминания, что здесь было..."
      />
    </div>

    <coach-spotlight
      v-if="showDateTip"
      :target="dateBlockRef"
      text="Метку можно создать на будущее — выберите дату и время"
      @close="dismissDateTip"
    />
  </div>
</template>

<style scoped lang="scss" src="./MarkForm.scss" />
