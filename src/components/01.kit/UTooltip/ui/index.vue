<script setup lang="ts">
import { onClickOutside, useEventListener, useWindowSize } from '@vueuse/core'

interface Props {
  show: boolean
  target: HTMLElement | null
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 200,
})

const emit = defineEmits<{ (e: 'close'): void }>()

const tooltipRef = ref<HTMLElement | null>(null)
const coords = ref({ x: 0, y: 0 })
const align = ref<'left' | 'center' | 'right'>('center')

/**
 * Логика умного позиционирования
 */
function updatePosition() {
  if (!props.target)
    return

  const rect = props.target.getBoundingClientRect()
  const { width: vw } = useWindowSize()
  const halfWidth = props.width / 2

  coords.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  }

  if (rect.left + rect.width / 2 - halfWidth < 10) {
    align.value = 'left'
    coords.value.x = rect.left
  }
  else if (rect.left + rect.width / 2 + halfWidth > vw.value - 10) {
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
  { ignore: [computed(() => props.target)] },
)

useEventListener('scroll', () => emit('close'), { capture: true, passive: true })

useEventListener('resize', updatePosition)

watch(() => props.target, () => {
  if (props.show)
    updatePosition()
})
</script>

<template>
  <teleport to="body">
    <transition name="pop">
      <div
        v-if="show"
        ref="tooltipRef"
        class="u-tooltip"
        :class="[`align-${align}`]"
        :style="{
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          width: `${width}px`,
        }"
      >
        <div class="u-tooltip__content">
          <slot />
        </div>
        <div class="u-tooltip__arrow" />
      </div>
    </transition>
  </teleport>
</template>

<style lang="scss" scoped>
.u-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: auto;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));

  &__content {
    @include glass-panel(14px, 12px, false);
    background: rgba(15, 18, 25, 0.98);
    border: 1px solid rgba(83, 112, 249, 0.4);
  }

  &__arrow {
    position: absolute;
    bottom: -5px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(83, 112, 249, 0.4);
  }

  &.align-center {
    transform: translate(-50%, -100%);
    .u-tooltip__arrow {
      left: 50%;
      transform: translateX(-50%);
    }
  }

  &.align-left {
    transform: translate(0, -100%);
    .u-tooltip__arrow {
      left: 25px;
    }
  }

  &.align-right {
    transform: translate(-100%, -100%);
    .u-tooltip__arrow {
      right: 25px;
      left: auto;
    }
  }
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
</style>
