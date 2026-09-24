<script setup lang="ts">
const props = defineProps<{
  target: HTMLElement | null
  text: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const PAD = 6

const rect = ref<{ top: number, left: number, width: number, height: number } | null>(null)

function updateRect() {
  if (!props.target) {
    rect.value = null
    return
  }
  const r = props.target.getBoundingClientRect()
  rect.value = { top: r.top, left: r.left, width: r.width, height: r.height }
}

let raf = 0
function loop() {
  updateRect()
  raf = requestAnimationFrame(loop)
}

const holeStyle = computed(() => {
  if (!rect.value)
    return { display: 'none' }
  return {
    top: `${rect.value.top - PAD}px`,
    left: `${rect.value.left - PAD}px`,
    width: `${rect.value.width + PAD * 2}px`,
    height: `${rect.value.height + PAD * 2}px`,
  }
})

const bubbleStyle = computed(() => {
  if (!rect.value)
    return { display: 'none' }
  return {
    top: `${rect.value.top - PAD - 12}px`,
    left: `${rect.value.left + rect.value.width / 2}px`,
  }
})

onMounted(() => {
  loop()
  window.addEventListener('resize', updateRect)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', updateRect)
})
</script>

<template>
  <teleport to="body">
    <div class="coach-spotlight">
      <div
        class="coach-spotlight__hole"
        :style="holeStyle"
      />
      <div
        class="coach-spotlight__bubble"
        :style="bubbleStyle"
      >
        <p class="coach-spotlight__text">
          {{ text }}
        </p>
        <button
          class="coach-spotlight__btn"
          type="button"
          @click="emit('close')"
        >
          Понятно
        </button>
        <span class="coach-spotlight__arrow" />
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.coach-spotlight {
  position: fixed;
  inset: 0;
  z-index: 10001;
  pointer-events: none;

  &__hole {
    position: fixed;
    border-radius: 12px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
    transition: all 0.2s ease;
  }

  &__bubble {
    position: fixed;
    transform: translate(-50%, -100%);
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: max-content;
    max-width: 260px;
    text-align: center;
    @include glass-panel(14px, 12px 14px, false);
  }

  &__text {
    margin: 0;
    @include value-text(13.5px, var(--text-color), 500);
    line-height: 1.4;
  }

  &__btn {
    align-self: stretch;
    padding: 8px 14px;
    border: none;
    border-radius: 10px;
    color: #fff;
    cursor: pointer;
    @include value-text(13px, #fff, 600);
    @include gradient();
  }

  &__arrow {
    position: absolute;
    bottom: -6px;
    left: 50%;
    width: 12px;
    height: 12px;
    transform: translateX(-50%) rotate(45deg);
    background: var(--bg-color-block);
    border-right: 0.5px solid var(--glass-border);
    border-bottom: 0.5px solid var(--glass-border);
  }
}
</style>
