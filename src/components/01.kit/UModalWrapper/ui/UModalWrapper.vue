<script setup lang="ts">
import { Close } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { useDialog } from '../models'

const {
  activeDialog,
  isVisible,
  options,
  onAfterLeave,
  close,
  handleOverlayClick,
} = useDialog()
</script>

<template>
  <teleport to=".n-config-provider">
    <transition
      :name="options?.transition || 'fade'"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="isVisible"
        class="modal-wrapper"
        :style="{
          '--modal-position': options?.position,
        }"
        @mousedown.self="handleOverlayClick"
      >
        <div
          class="modal-wrapper__container"
          :style="{
            '--modal-width': options?.width,
            '--modal-height': options?.height,
          }"
          :class="options?.classModal"
        >
          <header
            class="modal-wrapper__header"
          >
            <h3 class="modal-wrapper__title">
              {{ options?.title }}
            </h3>
            <button
              v-if="options?.closeable"
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

          <main class="modal-wrapper__body">
            <component
              :is="activeDialog?.component"
              v-bind="activeDialog?.props"
            />
          </main>
        </div>
      </div>
    </transition>
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
  z-index: 2000;

  &__container {
    background: var(--u-modal-wrapper-bg);

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

  &__body {
    padding: 1.2rem;
    overflow-y: auto;
    flex-grow: 1;
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease;

  .modal-wrapper__container {
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;

  .modal-wrapper__container {
    transform: translateY(100%);
  }
}
</style>
