<script setup lang="ts">
import type { Notification } from '@/components/00.shared/stores/notification'
import { useSwipe } from '@vueuse/core'

const props = defineProps<{ item: Notification }>()
const emit = defineEmits<{
  close: []
}>()

const containerRef = ref<HTMLElement | null>(null)

const swiping = ref(false)
const isOut = ref(false)
const returning = ref(false)
const x = ref(0)
const y = ref(0)
const axis = ref<'x' | 'y' | null>(null)
const boxHeight = ref<number | null>(null)

const DISMISS_X = 80
const DISMISS_Y = 64

const { lengthX, lengthY } = useSwipe(containerRef, {
  threshold: 8,
  onSwipeStart() {
    swiping.value = true
    axis.value = null
    clearAutoTimer()
  },
  onSwipe() {
    const dx = -lengthX.value
    const dy = -lengthY.value

    if (axis.value === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6)
        return
      axis.value = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
    }

    if (axis.value === 'x') {
      x.value = dx
      y.value = 0
    }
    else {
      x.value = 0
      y.value = Math.min(0, dy)
    }
  },
  onSwipeEnd() {
    swiping.value = false

    if (axis.value === 'x' && Math.abs(x.value) > DISMISS_X)
      dismiss(x.value > 0 ? 'right' : 'left')
    else if (axis.value === 'y' && y.value < -DISMISS_Y)
      dismiss('up')
    else
      snapBack()

    axis.value = null
  },
})

function emitClose() {
  emit('close')
}

let autoTimer: ReturnType<typeof setTimeout> | null = null

function clearAutoTimer() {
  if (autoTimer) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
}

function startAutoTimer() {
  clearAutoTimer()
  const d = props.item.duration
  if (d === 0)
    return
  autoTimer = setTimeout(dismiss, d ?? 5000, 'auto')
}

onMounted(startAutoTimer)
onBeforeUnmount(clearAutoTimer)

watch(() => props.item.closing, (v) => {
  if (v)
    dismiss('auto')
})

function endReturn() {
  returning.value = false
}

function snapBack() {
  returning.value = true
  x.value = 0
  y.value = 0
  startAutoTimer()
  window.setTimeout(endReturn, 300)
}

function dismiss(dir: 'left' | 'right' | 'up' | 'auto') {
  if (isOut.value)
    return
  clearAutoTimer()

  const el = containerRef.value
  const h = el ? el.offsetHeight : 0
  boxHeight.value = h

  if (dir === 'right')
    x.value = window.innerWidth
  else if (dir === 'left')
    x.value = -window.innerWidth
  else if (dir === 'up')
    y.value = -(h + 40)

  isOut.value = true

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      boxHeight.value = 0
    })
  })

  window.setTimeout(emitClose, 340)
}

const style = computed<Record<string, string>>(() => {
  const s: Record<string, string> = {}

  if (boxHeight.value !== null)
    s.height = `${boxHeight.value}px`

  if (isOut.value) {
    s.transform = `translate(${x.value}px, ${y.value}px)`
    s.opacity = '0'
    if (boxHeight.value === 0) {
      s.marginBottom = '0px'
      s.paddingTop = '0px'
      s.paddingBottom = '0px'
    }
    s.transition
      = 'transform 0.34s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, height 0.34s ease, margin 0.34s ease, padding 0.34s ease'
    return s
  }

  if (swiping.value) {
    const dist = Math.max(Math.abs(x.value), Math.abs(y.value))
    s.transform = `translate(${x.value}px, ${y.value}px)`
    s.opacity = String(Math.max(0, 1 - dist / 300))
    s.transition = 'none'
    return s
  }

  if (returning.value) {
    s.transform = 'translate(0px, 0px)'
    s.opacity = '1'
    s.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.28s ease'
    return s
  }
  return s
})

const defaultIcons = {
  info: 'solar:info-circle-bold',
  error: 'solar:danger-circle-bold',
  success: 'solar:check-circle-bold',
  warning: 'solar:danger-bold',
  default: 'solar:bell-bing-bold',
}
</script>

<template>
  <div
    ref="containerRef"
    class="notification-item"
    :class="[`type-${item.type}`, {
      'is-swiping': swiping || isOut,
    }]"
    :style="style"
  >
    <div class="icon-wrapper">
      <u-icon
        :icon="item.icon || defaultIcons[item.type]"
        width="20"
        height="20"
      />
    </div>

    <div class="content">
      <div class="header">
        <span class="title">{{ item.title }}</span>
        <span class="time">сейчас</span>
      </div>
      <p
        v-if="item.description"
        class="description"
      >
        {{ item.description }}
      </p>
      <div
        v-if="item.action"
        class="action-wrapper"
      >
        <button
          class="action-btn"
          @click="item.action.callback"
        >
          {{ item.action.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notification-item {
  width: 100%;
  max-width: 400px;
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  overflow: hidden;
  @include glass-panel(20px, 14px, false);
  cursor: grab;
  touch-action: none;
  will-change: transform, opacity, height;

  &.is-swiping {
    cursor: grabbing;
    user-select: none;
  }

  &.type-info {
    border-color: rgba(0, 163, 255, 0.4);
    background: rgba(0, 163, 255, 0.1);
    .icon-wrapper {
      color: #00a3ff;
    }
  }
  &.type-error {
    border-color: rgba(255, 90, 95, 0.4);
    background: rgba(255, 90, 95, 0.1);
    .icon-wrapper {
      color: #ff5a5f;
    }
  }
  &.type-success {
    border-color: rgba(130, 240, 13, 0.4);
    background: rgba(130, 240, 13, 0.1);
    .icon-wrapper {
      color: #82f00d;
    }
  }
  &.type-warning {
    border-color: rgba(255, 171, 0, 0.4);
    background: rgba(255, 171, 0, 0.1);
    .icon-wrapper {
      color: #ffab00;
    }
  }

  .icon-wrapper {
    flex-shrink: 0;
    width: 32px;
    height: 33px;
    border-radius: 10px;
    background: var(--surface-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    flex-grow: 1;
    min-width: 0;
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      .title {
        @include value-text(14px);
        font-weight: 800;
      }
      .time {
        @include label-text(10px, none, var(--text-color-muted));
      }
    }
    .description {
      @include label-text(12px, none, var(--text-color-secondary));
      line-height: 1.3;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;
      line-clamp: 4;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
  }
}

.action-wrapper {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-hover);
  color: var(--text-color);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--surface-hover);
  }
  &:active {
    transform: scale(0.95);
  }
}
</style>
