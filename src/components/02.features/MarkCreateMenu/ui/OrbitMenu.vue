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
  { side: 104, top: 104, bottom: 130, clampInitial: true },
)

const { closing, requestClose } = useMenuClose(() => emit('close'))
</script>

<template>
  <div
    class="orbit-overlay"
    :class="{ 'orbit-overlay--closing': closing }"
    @pointerdown.self="requestClose"
  >
    <div
      class="orbit"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    >
      <span class="orbit__ring" />

      <div class="orbit__pos orbit__pos--left">
        <button
          class="orbit__opt orbit__opt--public"
          type="button"
          @click="emit('public')"
        >
          <span class="orbit__circle">
            <u-icon
              icon="solar:map-point-bold"
              height="22"
            />
          </span>
        </button>
        <span class="orbit__label">Публичная</span>
      </div>

      <!-- Личная -->
      <div class="orbit__pos orbit__pos--right">
        <button
          class="orbit__opt orbit__opt--private"
          type="button"
          @click="emit('private')"
        >
          <span class="orbit__circle orbit__circle--muted">
            <u-icon
              icon="solar:lock-keyhole-bold"
              height="20"
            />
          </span>
        </button>
        <span class="orbit__label">Личная</span>
      </div>

      <!-- Маркер -->
      <span
        class="orbit__marker"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span class="orbit__marker-core" />
      </span>

      <span class="orbit__coords">{{ coordsLabel }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.orbit-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;

  &--closing {
    animation: menu-out 0.2s ease both;
  }
}

.orbit {
  position: absolute;
  width: 0;
  height: 0;
}

.orbit__ring {
  position: absolute;
  left: 0;
  top: 0;
  width: 150px;
  height: 150px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1.5px dashed color-mix(in srgb, var(--primary-color) 45%, transparent);
  animation: ring-in 0.3s ease both;
}

.orbit__pos {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  &--left {
    transform: translate(-50%, -50%) translate(-56px, -46px);
    animation: pop 0.34s cubic-bezier(0.34, 1.56, 0.5, 1) 0.14s both;
  }

  &--right {
    transform: translate(-50%, -50%) translate(56px, -46px);
    animation: pop 0.34s cubic-bezier(0.34, 1.56, 0.5, 1) 0.26s both;
  }
}

.orbit__opt {
  cursor: pointer;

  &:active .orbit__circle {
    transform: scale(0.92);
  }
}

.orbit__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  color: var(--primary-color);
  background: var(--bg-color-block);
  border: 1.5px dashed color-mix(in srgb, var(--primary-color) 55%, transparent);
  backdrop-filter: blur(12px);
  transition: transform 0.15s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);

  &--muted {
    color: var(--text-color-secondary);
    border-color: color-mix(in srgb, var(--text-color) 25%, transparent);
  }
}

.orbit__label {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--bg-color-block);
  backdrop-filter: blur(12px);
  @include value-text(12px, var(--text-color), 600);
  white-space: nowrap;
}

.orbit__marker {
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

.orbit__marker-core {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  border: 3px solid var(--bg-color-block);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--primary-color) 50%, transparent),
    0 4px 12px rgba(0, 0, 0, 0.45),
    0 0 14px color-mix(in srgb, var(--primary-color) 55%, transparent);
  transition: transform 0.15s ease;
}

.orbit__marker:active .orbit__marker-core {
  transform: scale(1.3);
}

.orbit__coords {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%) translate(0, 92px);
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--bg-color-block);
  border: 0.5px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  white-space: nowrap;
  @include value-text(12px, var(--text-color), 600);
  font-variant-numeric: tabular-nums;
  animation: fade-in 0.3s ease 0.34s both;
}

@keyframes ring-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
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

@keyframes pop {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes menu-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: scale(0.96);
  }
}
</style>
