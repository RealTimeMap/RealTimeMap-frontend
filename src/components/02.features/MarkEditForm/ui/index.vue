<script setup lang="ts">
import type { MarkFull } from '@/components/00.shared/services/mark/index.type'
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
      <div
        v-if="existingPhotos.length"
        class="mark-edit__photos"
      >
        <div
          v-for="url in existingPhotos"
          :key="url"
          class="mark-edit__photo"
        >
          <img
            :src="url"
            class="mark-edit__photo-img"
            alt="Фото метки"
          >
          <button
            type="button"
            class="mark-edit__photo-remove"
            aria-label="Удалить фото"
            @click="removeExistingPhoto(url)"
          >
            <u-icon
              icon="line-md:close"
              width="14"
              height="14"
            />
          </button>
        </div>
      </div>

      <u-ploader
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

<style scoped lang="scss">
.mark-edit__photos {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mark-edit__photo {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  border: 0.5px solid var(--border-subtle);
}

.mark-edit__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mark-edit__photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
}
</style>
