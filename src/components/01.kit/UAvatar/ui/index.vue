<script setup lang="ts">
interface Props {
  size: number
  rounded: boolean
  src?: string
  altText?: string
  backgroundColor?: string
}

const {
  size,
  src = undefined,
  altText = 'User Avatar',
  backgroundColor = 'linear-gradient(135deg, oklch(0.7 0.14 200), oklch(0.45 0.12 250))',
} = defineProps<Props>()

const emit = defineEmits<{
  colorExtracted: [color: string]
}>()

const fontSize = computed(() => {
  return `${Math.round(size * 0.38)}px`
})

function handleImageLoad(event: Event) {
  const imgElement = event.target as HTMLImageElement
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  canvas.width = 1
  canvas.height = 1

  try {
    ctx.drawImage(imgElement, 0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    emit('colorExtracted', `rgb(${r}, ${g}, ${b})`)
  }
  catch {}
}
</script>

<template>
  <div
    class="u-avatar"
    :style="{
      '--avatar-size': `${size}px`,
      '--avatart-round': rounded ? '50%' : '0%',
      '--avatar-bg': backgroundColor,
      '--avatar-font-size': fontSize,
    }"
  >
    <img
      v-if="src"
      :src="src"
      :alt="altText.slice(0, 2)"
      crossorigin="anonymous"
      @load="handleImageLoad"
    >
    <span
      v-else
      class="u-avatar__placeholder"
    >
      {{ altText.slice(0, 2) }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.u-avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: var(--avatart-round);
  background: var(--avatar-bg);

  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;

  box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 6px;

  &__placeholder {
    color: rgb(255, 255, 255);
    font-weight: 600;
    font-size: var(--avatar-font-size);
    text-transform: uppercase;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}
</style>
