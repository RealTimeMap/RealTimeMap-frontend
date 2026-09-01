<script setup lang="ts">
interface Props {
  max?: number
  maxSizeMb?: number
}

interface FilePreview {
  id: string
  file: File
  url: string
}

const { max = 4, maxSizeMb = 20 } = defineProps<Props>()

const emit = defineEmits<{
  'update:files': [files: File[]]
}>()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const fileList = shallowRef<FilePreview[]>([])
const isDragOver = ref(false)

const triggerInput = () => fileInput.value?.click()

const revokeUrl = (url: string) => URL.revokeObjectURL(url)

function handleFiles(files: FileList | null) {
  if (!files)
    return

  const incomingFiles = Array.from(files)
  const newEntries: FilePreview[] = []

  for (const file of incomingFiles) {
    if (fileList.value.length + newEntries.length >= max)
      break

    const isImage = file.type.startsWith('image/') || file.name.endsWith('.heic')
    const isLtSize = file.size / 1024 / 1024 < maxSizeMb

    if (isImage && isLtSize) {
      newEntries.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      })
    }
  }

  if (newEntries.length > 0) {
    fileList.value = [...fileList.value, ...newEntries]
    emit('update:files', fileList.value.map(f => f.file))
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  handleFiles(target.files)
  target.value = ''
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  handleFiles(e.dataTransfer?.files ?? null)
}

function removeFile(id: string) {
  const fileToRemove = fileList.value.find(f => f.id === id)
  if (fileToRemove) {
    revokeUrl(fileToRemove.url)
    fileList.value = fileList.value.filter(f => f.id !== id)
    emit('update:files', fileList.value.map(f => f.file))
  }
}

onUnmounted(() => {
  fileList.value.forEach(f => revokeUrl(f.url))
})
</script>

<template>
  <div class="uploader">
    <div
      v-if="fileList.length > 0"
      class="uploader__grid"
    >
      <div
        v-for="item in fileList"
        :key="item.id"
        class="uploader__preview"
      >
        <img
          :src="item.url"
          alt="preview"
          loading="lazy"
        >
        <button
          type="button"
          class="uploader__remove-btn"
          aria-label="Remove image"
          @click.stop="removeFile(item.id)"
        >
          ×
        </button>
      </div>
    </div>

    <div
      v-if="fileList.length < max"
      class="uploader__trigger"
      :class="{ 'uploader__trigger--dragover': isDragOver }"
      @click="triggerInput"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        class="uploader__input"
        accept="image/jpeg,image/png,image/heic"
        multiple
        @change="onFileChange"
      >

      <div class="uploader__content">
        <div class="uploader__icon">
          <u-icon
            icon="line-md:image"
            width="28"
            height="28"
          />
        </div>
        <span class="uploader__title">Добавить фото</span>
        <span class="uploader__tip">JPG / HEIC · до {{ maxSizeMb }} МБ</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.uploader {
  width: 100%;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  &__preview {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #1a2c38;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  &__trigger {
    width: 100%;
    height: 180px;
    background-color: var(--bg-color-block);
    border: 0.5px solid var(--border-subtle);
    border-radius: 24px;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;
    overflow: hidden;
    box-shadow:
      var(--glass-shadow-inset) 0px 1px 0px inset,
      var(--glass-shadow) 0px 10px 30px;

    // Эффект диагональных полосок
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 10px,
        rgba(255, 255, 255, 0.015) 10px,
        rgba(255, 255, 255, 0.015) 20px
      );
      pointer-events: none;
    }

    /* &:hover,
    &--dragover {
      border-color: #3b82f6;
      background-color: #081b26;
    } */

    /* &--dragover {
      transform: scale(1.01);
    } */
  }

  &__input {
    display: none;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
    pointer-events: none;
  }

  &__icon {
    margin-bottom: 12px;
  }

  &__title {
    font-size: 13px;
    color: var(--text-color);
    margin-bottom: 6px;
  }

  &__tip {
    color: var(--text-color);
    font-size: 11px;
  }
}
</style>
