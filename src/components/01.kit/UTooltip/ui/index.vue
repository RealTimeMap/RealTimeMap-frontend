<script setup lang="ts">
import { onClickOutside, useEventListener, useWindowSize } from '@vueuse/core'

interface Props {
  show: boolean
  target: HTMLElement | null
  width?: number
  /** bubble — компактный пузырь как подсказки в Telegram, фон в тон текущей темы. */
  variant?: 'glass' | 'bubble'
}

const { show, target, width = 200, variant = 'glass' } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const tooltipRef = ref<HTMLElement | null>(null)
const coords = ref({ x: 0, y: 0 })
const align = ref<'left' | 'center' | 'right'>('center')
const { width: viewportWidth } = useWindowSize()

/** Положение цели, когда подсказку открыли: прокрутка закрывает её, только если цель сдвинулась. */
let anchor: { left: number, top: number } | null = null
const SCROLL_TOLERANCE_PX = 4

/**
 * Логика умного позиционирования
 */
function updatePosition() {
  if (!target)
    return

  const rect = target.getBoundingClientRect()
  const halfWidth = width / 2
  anchor = { left: rect.left, top: rect.top }

  coords.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  }

  if (rect.left + rect.width / 2 - halfWidth < 10) {
    align.value = 'left'
    coords.value.x = rect.left
  }
  else if (rect.left + rect.width / 2 + halfWidth > viewportWidth.value - 10) {
    align.value = 'right'
    coords.value.x = rect.right
  }
  else {
    align.value = 'center'
  }
}

onClickOutside(
  tooltipRef,
  () => emit('close'),
  { ignore: [computed(() => target)] },
)

useEventListener('scroll', () => {
  if (!show || !target || !anchor)
    return
  const rect = target.getBoundingClientRect()
  if (Math.abs(rect.left - anchor.left) > SCROLL_TOLERANCE_PX || Math.abs(rect.top - anchor.top) > SCROLL_TOLERANCE_PX)
    emit('close')
}, { capture: true, passive: true })

useEventListener('resize', updatePosition)

watch(() => [target, show], () => {
  if (show)
    updatePosition()
}, { flush: 'sync' })
</script>

<template>
  <teleport to="body">
    <transition name="pop">
      <div
        v-if="show"
        ref="tooltipRef"
        class="u-tooltip"
        :class="[`align-${align}`, `u-tooltip--${variant}`]"
        :style="{
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          width: `${width}px`,
        }"
      >
        <div class="u-tooltip__body">
          <div class="u-tooltip__content">
            <slot />
          </div>
          <div class="u-tooltip__arrow" />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style lang="scss" scoped>
.u-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: auto;

  // Точка, из которой «вырастает» пузырь, — кончик стрелки над целью
  --origin-x: 50%;

  &__body {
    position: relative;
    transform-origin: var(--origin-x) calc(100% + 6px);
  }

  &__content {
    @include glass-panel(14px, 12px, false);
    background: var(--popover-bg);
    border: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent);
  }

  &__arrow {
    position: absolute;
    bottom: -5px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid color-mix(in srgb, var(--primary-color) 40%, transparent);
  }

  // Фон всплывающих окон темы, подкрашенный её акцентом: в каждой теме пузырь в своих цветах
  &--bubble {
    --bubble-bg: color-mix(in oklab, color-mix(in oklab, var(--primary-color) 14%, var(--popover-bg)) 94%, transparent);
  }

  &--bubble &__content {
    padding: 9px 12px;
    border: 1px solid color-mix(in srgb, var(--primary-color) 22%, transparent);
    border-radius: 12px;
    background: var(--bubble-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.18);
    color: var(--text-color);
  }

  &--bubble &__arrow {
    border-top-color: var(--bubble-bg);
  }

  &.align-center {
    transform: translate(-50%, -100%);
    .u-tooltip__arrow {
      left: 50%;
      transform: translateX(-50%);
    }
  }

  &.align-left {
    --origin-x: 31px;
    transform: translate(0, -100%);
    .u-tooltip__arrow {
      left: 25px;
    }
  }

  &.align-right {
    --origin-x: calc(100% - 31px);
    transform: translate(-100%, -100%);
    .u-tooltip__arrow {
      right: 25px;
      left: auto;
    }
  }
}

// Пузырь вырастает из иконки с лёгкой пружиной и сжимается обратно в неё.
// Анимирован внутренний слой: у корня transform занят позиционированием
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.28s ease;
}

.pop-enter-active .u-tooltip__body {
  transition: transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pop-leave-active .u-tooltip__body {
  transition: transform 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;

  .u-tooltip__body {
    transform: scale(0.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active .u-tooltip__body,
  .pop-leave-active .u-tooltip__body {
    transition: none;
  }
}
</style>
