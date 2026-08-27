<script setup lang="ts">
import { useDialog } from '../model'

const swipeZoneRef = ref<HTMLElement | null>(null)

const {
  dialogs,
  close,
  handleOverlayClick,
  getSwipeStyle,
  handleBodyScroll,
} = useDialog(swipeZoneRef)
</script>

<template>
  <teleport to="body">
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
              swipeZoneRef = el as HTMLElement
          }"
          class="modal-wrapper__container"
          :style="[
            {
              '--modal-width': dialog.options?.width,
              '--modal-height': dialog.options?.height,
            },
            dialog.options.swipeable ? getSwipeStyle(index) : {},
          ]"
          :class="[dialog.options?.classModal, dialog.options.transition]"
        >
          <div
            class="modal-wrapper__swipe-zone"
          >
            <div
              v-if="dialog.options.swipeable"
              class="modal-wrapper__heading"
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
                <u-icon
                  icon="material-symbols:close"
                  height="24"
                />
              </button>
            </header>
          </div>

          <main
            class="modal-wrapper__body"
            @scroll="handleBodyScroll"
          >
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

<style lang="scss" scoped src="../styles/index.scss" />
