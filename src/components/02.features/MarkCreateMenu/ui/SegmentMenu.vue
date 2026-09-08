<script setup lang="ts">
import type { MapPoint } from '@/types/shared/map'
import { useMarkMenu, useMenuClose } from '../model/useMarkMenu'

const props = defineProps<{
  x: number
  y: number
  coords: MapPoint
}>()

const emit = defineEmits<{
  (e: 'public'): void
  (e: 'private'): void
  (e: 'close'): void
  (e: 'move', x: number, y: number): void
}>()

const { pos, coordsLabel, onDragStart, onDragMove, onDragEnd } = useMarkMenu(
  props,
  (x, y) => emit('move', x, y),
)

const { closing, requestClose } = useMenuClose(() => emit('close'))

const selected = ref<'public' | 'private'>('public')

const hint = computed(() =>
  selected.value === 'public'
    ? 'Публичная метка видна всем рядом и живёт ограниченное время.'
    : 'Личная метка видна только вам — с заметкой и фото.',
)

function confirm() {
  if (selected.value === 'public')
    emit('public')
  else
    emit('private')
}
</script>

<template>
  <teleport to="body">
    <div
      class="seg-overlay"
      :class="{ 'seg-overlay--closing': closing }"
      @pointerdown.self="requestClose"
    >
      <div
        class="seg-anchor"
        :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
      >
        <span
          class="seg__marker"
          @pointerdown="onDragStart"
          @pointermove="onDragMove"
          @pointerup="onDragEnd"
          @pointercancel="onDragEnd"
        >
          <span class="seg__pin-dot" />
        </span>
      </div>

      <div
        class="seg"
        :class="{ 'seg--closing': closing }"
      >
        <div class="seg__head">
          <span class="seg__caption">Тип метки</span>
          <span class="seg__coords">{{ coordsLabel }}</span>
        </div>

        <div class="seg__switch">
          <span
            class="seg__thumb"
            :class="{ 'seg__thumb--right': selected === 'private' }"
          />
          <button
            class="seg__seg"
            :class="{ 'seg__seg--active': selected === 'public' }"
            type="button"
            @click="selected = 'public'"
          >
            <u-icon
              icon="solar:map-point-bold"
              height="16"
            />
            Публичная
          </button>
          <button
            class="seg__seg"
            :class="{ 'seg__seg--active': selected === 'private' }"
            type="button"
            @click="selected = 'private'"
          >
            <u-icon
              icon="solar:lock-keyhole-bold"
              height="15"
            />
            Личная
          </button>
        </div>

        <p class="seg__hint">
          {{ hint }}
        </p>

        <div class="seg__actions">
          <button
            class="seg__btn seg__btn--ghost"
            type="button"
            @click="requestClose"
          >
            Отмена
          </button>
          <button
            class="seg__btn seg__btn--primary"
            type="button"
            @click="confirm"
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.seg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(1px);
  animation: scrim-in 0.28s ease both;

  &--closing {
    animation: scrim-out 0.22s ease both;
  }
}

.seg-anchor {
  position: absolute;
  width: 0;
  height: 0;
}

.seg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(110px + env(safe-area-inset-bottom));
  width: 90%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 14px calc(16px + env(safe-area-inset-bottom));
  border-radius: 24px;
  background: var(--u-modal-wrapper-bg);
  border: 0.5px solid var(--border-subtle);
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
  animation: sheet-up 0.3s cubic-bezier(0.3, 1.05, 0.4, 1) both;

  &--closing {
    animation: sheet-down 0.22s ease-in both;
  }
}

.seg__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
}

.seg__caption {
  @include label-text(12px, uppercase);
}

.seg__coords {
  @include value-text(13px, var(--text-color), 600);
  font-variant-numeric: tabular-nums;
}

.seg__switch {
  position: relative;
  display: flex;
  padding: 5px;
  border-radius: 15px;
  background: var(--surface-subtle);
}

.seg__thumb {
  position: absolute;
  top: 5px;
  left: 5px;
  width: calc(50% - 5px);
  height: calc(100% - 10px);
  border-radius: 11px;
  @include gradient();
  transition: transform 0.22s cubic-bezier(0.3, 1.1, 0.4, 1);

  &--right {
    transform: translateX(100%);
  }
}

.seg__seg {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex: 1;
  padding: 12px 6px;
  cursor: pointer;
  border-radius: 11px;
  color: var(--text-color-secondary);
  @include value-text(15px, var(--text-color-secondary), 600);
  transition: color 0.2s ease;

  &--active {
    color: #fff;
  }
}

.seg__hint {
  padding: 0 4px;
  @include label-text(13px, none);
  line-height: 1.4;
}

.seg__actions {
  display: flex;
  gap: 10px;
}

.seg__btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  cursor: pointer;
  @include value-text(15px, var(--text-color), 600);
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.98);
  }

  &--ghost {
    background: var(--surface-subtle);
  }

  &--primary {
    color: #fff;
    @include gradient();
  }
}

.seg__marker {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
  cursor: grab;
  touch-action: none;
  animation: marker-pop 0.28s cubic-bezier(0.34, 1.56, 0.5, 1) both;

  &:active {
    cursor: grabbing;
  }
}

.seg__pin-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: var(--primary-color);
  border: 2px solid var(--bg-color-block);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--primary-color) 25%, transparent),
    0 0 14px color-mix(in srgb, var(--primary-color) 70%, transparent);
}

.seg__marker:active .seg__pin {
  transform: translateX(-50%) scale(1.08);
}

@keyframes marker-pop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes sheet-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

@keyframes scrim-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scrim-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
