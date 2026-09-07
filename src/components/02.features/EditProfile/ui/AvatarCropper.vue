<script setup lang="ts">
import { useDialogStore } from '@/components/00.shared/stores/dialog'

const props = defineProps<{
  /** Исходный файл, выбранный пользователем */
  file: File
  /** Возвращает обрезанный квадратный файл */
  onApply: (file: File) => void
}>()

const VIEWPORT = 280
const RADIUS = VIEWPORT / 2
const OUTPUT = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 4

const { close } = useDialogStore()

const objectUrl = URL.createObjectURL(props.file)
const imgEl = ref<HTMLImageElement | null>(null)

const naturalW = ref(0)
const naturalH = ref(0)
const ready = ref(false)

const zoom = ref(1)
const rotation = ref(0)
const panX = ref(0)
const panY = ref(0)

const coverScale = computed(() => {
  const min = Math.min(naturalW.value, naturalH.value)
  return min ? VIEWPORT / min : 1
})
const pixelScale = computed(() => coverScale.value * zoom.value)
const dispW = computed(() => naturalW.value * pixelScale.value)
const dispH = computed(() => naturalH.value * pixelScale.value)

const imageStyle = computed(() => {
  const left = VIEWPORT / 2 + panX.value - dispW.value / 2
  const top = VIEWPORT / 2 + panY.value - dispH.value / 2
  return {
    width: `${dispW.value}px`,
    height: `${dispH.value}px`,
    transform: `translate(${left}px, ${top}px) rotate(${rotation.value}deg)`,
  }
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const zoomPercent = computed(() => ((zoom.value - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100)
const rotationPercent = computed(() => ((rotation.value + 180) / 360) * 100)

const isDirty = computed(() =>
  zoom.value !== 1 || rotation.value !== 0 || panX.value !== 0 || panY.value !== 0,
)

function reset() {
  zoom.value = 1
  rotation.value = 0
  panX.value = 0
  panY.value = 0
}

function clampPan() {
  const rad = (rotation.value * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  const localX = panX.value * cos + panY.value * sin
  const localY = -panX.value * sin + panY.value * cos

  const maxX = Math.max(0, dispW.value / 2 - RADIUS)
  const maxY = Math.max(0, dispH.value / 2 - RADIUS)

  const cx = clamp(localX, -maxX, maxX)
  const cy = clamp(localY, -maxY, maxY)

  panX.value = cx * cos - cy * sin
  panY.value = cx * sin + cy * cos
}

watch([zoom, rotation], clampPan)

function onImageLoad() {
  const el = imgEl.value
  if (!el)
    return
  naturalW.value = el.naturalWidth
  naturalH.value = el.naturalHeight
  ready.value = true
  clampPan()
}

function rotate90() {
  rotation.value = (rotation.value + 90) % 360
}

const pointers = new Map<number, { x: number, y: number }>()
let lastX = 0
let lastY = 0
let pinchStartDist = 0
let pinchStartZoom = 1

function onPointerDown(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (pointers.size === 1) {
    lastX = e.clientX
    lastY = e.clientY
  }
  else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y)
    pinchStartZoom = zoom.value
  }
}

function onPointerMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId))
    return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (pointers.size >= 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (pinchStartDist > 0) {
      zoom.value = clamp(pinchStartZoom * (dist / pinchStartDist), MIN_ZOOM, MAX_ZOOM)
      clampPan()
    }
    return
  }

  panX.value += e.clientX - lastX
  panY.value += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  clampPan()
}

function onPointerUp(e: PointerEvent) {
  pointers.delete(e.pointerId)
  if (pointers.size === 1) {
    const [p] = [...pointers.values()]
    lastX = p.x
    lastY = p.y
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  zoom.value = clamp(zoom.value - e.deltaY * 0.001, MIN_ZOOM, MAX_ZOOM)
  clampPan()
}

function apply() {
  if (!ready.value || !imgEl.value)
    return

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT
  canvas.height = OUTPUT
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  ctx.imageSmoothingQuality = 'high'

  const k = OUTPUT / VIEWPORT
  const s = pixelScale.value
  const rad = (rotation.value * Math.PI) / 180

  ctx.translate(OUTPUT / 2, OUTPUT / 2)
  ctx.translate(panX.value * k, panY.value * k)
  ctx.rotate(rad)
  ctx.scale(s * k, s * k)
  ctx.drawImage(imgEl.value, -naturalW.value / 2, -naturalH.value / 2)

  canvas.toBlob((blob) => {
    if (!blob)
      return
    const cropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    props.onApply(cropped)
    close()
  }, 'image/jpeg', 0.9)
}

onUnmounted(() => URL.revokeObjectURL(objectUrl))
</script>

<template>
  <div class="cropper">
    <div class="cropper__header">
      <button
        class="button-back"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Фото</h2>
      <button
        class="button-save"
        :disabled="!ready"
        @click="apply"
      >
        Применить
      </button>
    </div>

    <div class="cropper__stage-wrap">
      <div
        class="cropper__stage"
        :style="{ width: `${VIEWPORT}px`, height: `${VIEWPORT}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel="onWheel"
      >
        <img
          ref="imgEl"
          class="cropper__image"
          :src="objectUrl"
          :style="imageStyle"
          alt=""
          draggable="false"
          @load="onImageLoad"
        >
        <div class="cropper__window" />
      </div>
      <p class="cropper__hint">
        Двигайте, приближайте и поворачивайте фото
      </p>
    </div>

    <div class="cropper__controls">
      <div class="cropper__row">
        <u-icon
          icon="solar:minimalistic-magnifer-zoom-out-linear"
          height="18"
        />
        <input
          v-model.number="zoom"
          class="cropper__slider"
          :style="{ '--fill': `${zoomPercent}%` }"
          type="range"
          :min="MIN_ZOOM"
          :max="MAX_ZOOM"
          step="0.01"
        >
        <u-icon
          icon="solar:minimalistic-magnifer-zoom-in-linear"
          height="18"
        />
      </div>

      <div class="cropper__row">
        <button
          class="cropper__rotate"
          type="button"
          title="Повернуть на 90°"
          @click="rotate90"
        >
          <u-icon
            icon="solar:restart-linear"
            height="18"
          />
        </button>
        <input
          v-model.number="rotation"
          class="cropper__slider"
          :style="{ '--fill': `${rotationPercent}%` }"
          type="range"
          min="-180"
          max="180"
          step="1"
        >
        <span class="cropper__deg">{{ Math.round(rotation) }}°</span>
      </div>

      <button
        class="cropper__reset"
        type="button"
        :disabled="!isDirty"
        @click="reset"
      >
        <u-icon
          icon="solar:refresh-linear"
          height="16"
        />
        Сбросить
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cropper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
  padding-bottom: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;

    .button-back {
      @include glass-panel(12px, 10px, false);
    }

    h2 {
      @include value-text(24px, var(--text-color), 700);
    }
  }

  &__stage-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  &__stage {
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    background: var(--surface-subtle);
    touch-action: none;
    cursor: grab;
    user-select: none;

    &:active {
      cursor: grabbing;
    }
  }

  &__image {
    position: absolute;
    top: 0;
    left: 0;
    max-width: none;
    transform-origin: center;
    will-change: transform;
    pointer-events: none;
  }

  &__window {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    box-shadow: 0 0 0 9999px color-mix(in srgb, #000 45%, transparent);
    border: 2px solid color-mix(in srgb, #fff 55%, transparent);
    pointer-events: none;
  }

  &__hint {
    @include label-text(12px, none);
    text-align: center;
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: 14px;
    @include glass-panel(18px, 16px, false);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-color-secondary);
  }

  &__deg {
    min-width: 42px;
    text-align: right;
    @include label-text(12px, none);
    font-variant-numeric: tabular-nums;
  }

  &__rotate {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 12px;
    color: var(--text-color);
    cursor: pointer;
    background: var(--surface-subtle);
    border: 0.5px solid var(--border-subtle);
  }

  &__reset {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 40px;
    border-radius: 12px;
    cursor: pointer;
    background: var(--surface-subtle);
    border: 0.5px solid var(--border-subtle);
    @include value-text(14px, var(--text-color), 600);

    &:disabled {
      opacity: 0.45;
      pointer-events: none;
    }
  }
}

.cropper__slider {
  flex: 1;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(to right, var(--primary-color) var(--fill, 0%), var(--surface-hover) var(--fill, 0%));

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--primary-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    cursor: grab;
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--primary-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    cursor: grab;
  }

  &::-moz-range-track {
    background: transparent;
  }
}

.button-save {
  margin-left: auto;
  padding: 10px 18px;
  border-radius: 14px;
  @include gradient();
  @include value-text(15px, #fff, 700);
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
