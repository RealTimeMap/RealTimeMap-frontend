<script setup lang="ts">
interface Props {
  existing?: string[]
  max?: number
  maxSizeMb?: number
}

const { existing = [], max = 4, maxSizeMb = 20 } = defineProps<Props>()

const emit = defineEmits<{
  removeExisting: [url: string]
}>()

const files = defineModel<File[]>('files', { default: () => [] })

interface NewPhoto {
  id: string
  file: File
  url: string
}

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const newPhotos = ref<NewPhoto[]>([])

const totalPhotos = computed(() => existing.length + newPhotos.value.length)
const canAddMore = computed(() => totalPhotos.value < max)

function syncFiles() {
  files.value = newPhotos.value.map(p => p.file)
}

function triggerInput() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    for (const file of Array.from(target.files)) {
      if (totalPhotos.value >= max)
        break
      const isImage = file.type.startsWith('image/') || file.name.endsWith('.heic')
      const isLtSize = file.size / 1024 / 1024 < maxSizeMb
      if (isImage && isLtSize) {
        newPhotos.value.push({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
        })
      }
    }
    syncFiles()
  }
  target.value = ''
}

function removeNewPhoto(id: string) {
  const photo = newPhotos.value.find(p => p.id === id)
  if (photo)
    URL.revokeObjectURL(photo.url)
  newPhotos.value = newPhotos.value.filter(p => p.id !== id)
  syncFiles()
}

onUnmounted(() => {
  newPhotos.value.forEach(p => URL.revokeObjectURL(p.url))
})
</script>

<template>
  <div class="photo-input">
    <input
      ref="fileInput"
      type="file"
      class="photo-input__input"
      accept="image/jpeg,image/png,image/heic"
      multiple
      @change="onFileChange"
    >

    <div
      v-if="totalPhotos === 0"
      class="photo-input__dropzone"
      @click="triggerInput"
    >
      <u-icon
        icon="line-md:image"
        width="28"
        height="28"
      />
      <span class="photo-input__dz-title">Добавить фото</span>
      <span class="photo-input__dz-tip">JPG / HEIC · до {{ maxSizeMb }} МБ</span>
    </div>

    <template v-else>
      <div class="photo-input__label">
        <span class="label-text">Фотографии</span>
        <span class="photo-input__counter">{{ totalPhotos }} / {{ max }}</span>
      </div>

      <div class="photo-input__gallery">
        <div
          v-for="url in existing"
          :key="url"
          class="photo-input__cell"
        >
          <img
            :src="url"
            class="photo-input__cell-img"
            alt="Фото метки"
          >
          <button
            type="button"
            class="photo-input__cell-remove"
            aria-label="Удалить фото"
            @click="emit('removeExisting', url)"
          >
            <u-icon
              icon="line-md:close"
              width="13"
              height="13"
            />
          </button>
        </div>

        <div
          v-for="photo in newPhotos"
          :key="photo.id"
          class="photo-input__cell"
        >
          <img
            :src="photo.url"
            class="photo-input__cell-img"
            alt="Новое фото"
          >
          <button
            type="button"
            class="photo-input__cell-remove"
            aria-label="Удалить фото"
            @click="removeNewPhoto(photo.id)"
          >
            <u-icon
              icon="line-md:close"
              width="13"
              height="13"
            />
          </button>
        </div>

        <button
          v-if="canAddMore"
          type="button"
          class="photo-input__cell photo-input__add"
          @click="triggerInput"
        >
          <u-icon
            icon="solar:add-square-linear"
            width="24"
            height="24"
          />
          <span>Добавить</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.photo-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-input__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.photo-input__counter {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.photo-input__gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.photo-input__cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  @include glass-panel(14px, 0);
}

.photo-input__cell-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-input__cell-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
}

.photo-input__add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--bg-color-block);
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease;

  span {
    font-size: 11px;
    font-weight: 500;
  }

  &:active {
    border-color: var(--primary-color);
  }
}

.photo-input__input {
  display: none;
}

.photo-input__dropzone {
  width: 100%;
  height: 180px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  color: var(--text-color);

  @include glass-panel(24px, 0);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      color-mix(in srgb, var(--text-color) 4%, transparent) 10px,
      color-mix(in srgb, var(--text-color) 4%, transparent) 20px
    );
    pointer-events: none;
  }
}

.photo-input__dz-title {
  font-size: 13px;
  color: var(--text-color);
}

.photo-input__dz-tip {
  font-size: 11px;
  color: var(--text-color-secondary);
}
</style>
