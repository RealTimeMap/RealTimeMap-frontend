<script setup lang="ts">
import { Close } from '@vicons/ionicons5'
import { useSwipe } from '@vueuse/core'
import { NIcon } from 'naive-ui'
import { useDialog } from '../models'

const {
  dialogs,
  close,
  handleOverlayClick,
} = useDialog()

const containerRef = ref<HTMLElement | null>(null)

const { lengthY, isSwiping, direction } = useSwipe(containerRef, {
  onSwipeEnd() {
    if (direction.value === 'down' && lengthY.value < -150) {
      close()
    }
  },
})

function getSwipeStyle(index: number) {
  const isLast = index === dialogs.value.length - 1
  if (isLast && isSwiping.value && lengthY.value < 0) {
    return {
      transform: `translateY(${Math.abs(lengthY.value)}px)`,
      transition: 'none',
    }
  }
  return {}
}
</script>

<template>
  <teleport to=".n-config-provider">
    <transition-group
      name="modal-fade"
      tag="div"
    >
      <div
        v-for="(dialog, index) in dialogs"
        :key="dialog.id"
        class="modal-wrapper"
        :style="{
          '--modal-position': dialog.options.position,
          'zIndex': 2000 + (index * 10),
        }"
        @mousedown.self="() => handleOverlayClick(index)"
      >
        <div
          :ref="(el) => {
            if (index === dialogs.length - 1)
              containerRef = el as HTMLElement
          }"
          class="modal-wrapper__container"
          :style="[
            {
              '--modal-width': dialog.options?.width,
              '--modal-height': dialog.options?.height,
            },
            getSwipeStyle(index),
          ]"
          :class="[dialog.options?.classModal, dialog.options.transition]"
        >
          <div
            class="modal-wrapper__swipe-handle"
            @click="close"
          />

          <header
            v-if="dialog.options?.headerModal"
            class="modal-wrapper__header"
          >
            <h3 class="modal-wrapper__title">
              {{ dialog.options?.title }}
            </h3>
            <button
              v-if="dialog.options?.closeable"
              class="modal-wrapper__close-btn"
              aria-label="Закрыть модальное окно"
              @click="close"
            >
              <n-icon
                :component="Close"
                size="24"
              />
            </button>
          </header>

          <div class="modal-wrapper__heading" />

          <main class="modal-wrapper__body">
            <component
              :is="dialog.component"
              v-bind="dialog.props"
            />
          </main>
        </div>
      </div>
    </transition-group>
  </teleport>
</template>

<style lang="scss" scoped>
.modal-wrapper {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: var(--modal-position, center);
  justify-content: center;

  &__container {
    background: var(--u-modal-wrapper-bg);
    border: 0.5px solid rgba(255, 255, 255, 0.12);

    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);

    will-change: transform;
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;

    max-width: var(--modal-width);
    height: var(--modal-height);

    touch-action: none;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.2rem;
    /* border-bottom: 1px solid #eee; */
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  &__close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: #888;
    transition: color 0.2s ease;

    &:hover {
      color: #333;
    }
  }

  &__heading {
    width: 36px;
    height: 5px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.25);
    margin: 8px auto 0px;
    flex-shrink: 0;
  }

  &__body {
    padding: 1.2rem;
    overflow-y: auto;
    flex-grow: 1;
    max-height: 90dvh;
    touch-action: pan-y;
  }

  &__footer {
    padding: 1.5rem;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;

    &:empty {
      display: none;
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
  .modal-wrapper__container {
    transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  .modal-wrapper__container.slide-up {
    transform: translateY(100%);
  }
}
</style>
