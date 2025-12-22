<script setup lang="ts">
interface Props {
  size?: number
  strokeWidth?: number
  progress?: number
  level?: number | string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 60,
  strokeWidth: 4,
  progress: 0,
  color: '#4cd197',
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
  transform: rotate(-90deg);
  z-index: 1;

  .xp-ring__track {
    stroke: #f0f0f0;
  }

  .xp-ring__progress {
    transition: stroke-dashoffset 1s ease-out;
    will-change: stroke-dashoffset;
  }
}

.xp-ring-content {
  z-index: 2;
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex;
  justify-content: center;
  align-items: center;

  :deep(*) {
    display: block;
  }
}

.xp-level-badge {
  position: absolute;
  bottom: -5px;
  z-index: 3;

  background: #333;
  color: #fff;
  font-size: 11px;
  font-weight: bold;

  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  border: 2px solid #fff;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
</style>
