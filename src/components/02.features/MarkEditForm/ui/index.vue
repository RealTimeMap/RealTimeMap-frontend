<script setup lang="ts">
import type { MarkFull } from '@/components/00.shared/services/mark/index.type'
import MarkPhotoInput from '@/components/02.features/MarkForm/ui/MarkPhotoInput.vue'
import { useMarkEdit } from '../model'

const props = defineProps<{
  mark: MarkFull
  onSaved?: () => void
}>()

const {
  markName,
  additionalInfo,
  selectedCategoryId,
  existingPhotos,
  fileList,
  categoryOptions,
  isSubmitting,

  fetchCreateData,
  removeExistingPhoto,
  handleSubmit,
  close,
} = useMarkEdit(props.mark, props.onSaved)

onMounted(() => {
  fetchCreateData()
})
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
        Редактирование
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
      <mark-photo-input
        v-model:files="fileList"
        :existing="existingPhotos"
        :max="4"
        :max-size-mb="20"
        @remove-existing="removeExistingPhoto"
      />

      <div class="u-block mark-form__fields">
        <u-input
          v-model="markName"
          label="Название"
          placeholder="Напр. «Двор на Патриарших»"
        />
        <u-drawer />
        <u-select
          v-model="selectedCategoryId"
          label="Категория"
          :options="categoryOptions"
          :parent-padding="14"
        />
      </div>

      <u-text-area
        v-model="additionalInfo"
        label="Описание"
        placeholder="История этого места, воспоминания, что здесь было..."
      />
    </div>
  </div>
</template>

<style scoped lang="scss" src="../../MarkForm/ui/MarkForm.scss" />
