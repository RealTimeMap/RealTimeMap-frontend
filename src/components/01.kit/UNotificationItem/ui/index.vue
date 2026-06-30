<script setup lang="ts">
import type { Notification } from '@/shared/stores/notification'
import { useSwipe } from '@vueuse/core'

defineProps<{ item: Notification }>()
const emit = defineEmits<{
  close: []
}>()

const containerRef = ref<HTMLElement | null>(null)

const { lengthX, isSwiping } = useSwipe(containerRef, {
  onSwipeEnd(e, direction) {
    if (direction === 'right' && lengthX.value < -100) {
      emit('close')
    }
  },
})

const swipeStyle = computed(() => {
  if (isSwiping.value && lengthX.value < 0) {
    return {
      transform: `translateX(${Math.abs(lengthX.value)}px)`,
      opacity: 1 - Math.abs(lengthX.value) / 300,
    }
  }
  return {}
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
    :class="[`type-${item.type}`]"
    :style="swipeStyle"
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
  @include glass-panel(20px, 14px, false);
  cursor: grab;
  touch-action: pan-y;
  will-change: transform, opacity;

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
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    flex-grow: 1;
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      .title {
        @include value-text(14px);
        font-weight: 800;
      }
      .time {
        @include label-text(10px, none, rgba(255, 255, 255, 0.3));
      }
    }
    .description {
      @include label-text(12px, none, rgba(255, 255, 255, 0.6));
      line-height: 1.3;
    }
  }
}
</style>
