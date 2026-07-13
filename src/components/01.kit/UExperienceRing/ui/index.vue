<script setup lang="ts">
interface Props {
  size?: number
  strokeWidth?: number
  progress?: number
  level?: number | string
  color?: string
  showRing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 60,
  strokeWidth: 4,
  progress: 0,
  color: '#7aafeb',
  level: undefined,
  showRing: true,
})

// --- ГЕОМЕТРИЯ ---
const ringSize = computed(() => props.size + 12)
const radius = computed(() => (ringSize.value - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

// --- АНИМАЦИЯ ---
const isAnimated = ref(false)

onMounted(() => {
  setTimeout(() => {
    isAnimated.value = true
  }, 100)
})

const dashOffset = computed(() => {
  if (!isAnimated.value) {
    return circumference.value
  }
  return circumference.value - (props.progress / 100) * circumference.value
})
</script>

<template>
  <div
    class="xp-ring-wrapper"
    :style="{ width: `${ringSize}px`, height: `${ringSize}px` }"
  >
    <svg
      v-if="showRing"
      class="xp-ring-svg"
      :width="ringSize"
      :height="ringSize"
    >
      <circle
        class="xp-ring__track"
        :stroke-width="strokeWidth"
        :r="radius"
        :cx="ringSize / 2"
        :cy="ringSize / 2"
        fill="transparent"
      />
      <circle
        class="xp-ring__progress"
        :stroke-width="strokeWidth"
        :r="radius"
        :cx="ringSize / 2"
        :cy="ringSize / 2"
        fill="transparent"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        :style="{ stroke: color }"
      />
    </svg>

    <div class="xp-ring-content">
      <slot />
    </div>

    <div
      v-if="level !== undefined"
      class="xp-level-badge"
    >
      <span>{{ level }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.xp-ring-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.xp-ring-svg {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(90deg);
  z-index: 1;

  .xp-ring__track {
    stroke: oklch(0.12 0.03 220);
  }

  .xp-ring__progress {
    transition: stroke-dashoffset 1s ease-out;
    will-change: stroke-dashoffset;
  }
}

.xp-ring-content {
  z-index: 2;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  /* :deep(*) {
    display: block;
  } */
}

.xp-level-badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  min-width: 30px;
  height: 30px;
  padding: 0px 8px;
  border-radius: 15px;
  background: linear-gradient(135deg, oklch(0.62 0.22 220), oklch(0.45 0.2 290));
  border: 2.5px solid oklch(0.12 0.03 220);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: rgb(255, 255, 255);
  box-shadow: oklch(0.62 0.22 220 / 0.5) 0px 4px 12px;
  z-index: 2;
}
</style>
