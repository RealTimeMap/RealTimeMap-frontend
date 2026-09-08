<script setup lang="ts">
import type { MapPoint } from '@/types/shared/map'
import { MENU_MARGIN, MENU_TOP_RESERVE, useMarkMenu, useMenuClose } from '../model/useMarkMenu'

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

const { pos, clamp, coordsLabel, onDragStart, onDragMove, onDragEnd } = useMarkMenu(
  props,
  (x, y) => emit('move', x, y),
)

const { closing, requestClose } = useMenuClose(() => emit('close'))

const BAR_HALF = 108
const COORDS_HALF = 84
const GAP = 26
const COORDS_GAP = 30
const BAR_EST_H = 60

const layout = computed(() => {
  const vw = window.innerWidth
  const above = pos.y - BAR_EST_H - GAP > MENU_TOP_RESERVE
  const barShiftX = clamp(pos.x, MENU_MARGIN + BAR_HALF, vw - MENU_MARGIN - BAR_HALF) - pos.x
  const coordsShiftX = clamp(pos.x, MENU_MARGIN + COORDS_HALF, vw - MENU_MARGIN - COORDS_HALF) - pos.x
  return { above, barShiftX, coordsShiftX }
})

const barStyle = computed(() => {
  const { above, barShiftX } = layout.value
  return above
    ? { transform: `translate(-50%, -100%) translate(${barShiftX}px, -${GAP}px)` }
    : { transform: `translate(-50%, 0) translate(${barShiftX}px, ${GAP}px)` }
})

const coordsStyle = computed(() => {
  const { above, coordsShiftX } = layout.value
  const dy = above ? COORDS_GAP : -COORDS_GAP
  return { transform: `translate(-50%, -50%) translate(${coordsShiftX}px, ${dy}px)` }
})
</script>

<template>
  <div
    class="bar-overlay"
    :class="{ 'bar-overlay--closing': closing }"
    @pointerdown.self="requestClose"
  >
    <div
      class="bar"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    >
      <div
        class="bar__panel"
        :style="barStyle"
      >
        <button
          class="bar__btn"
          type="button"
          @click="emit('public')"
        >
          <span class="bar__ic bar__ic--public">
            <u-icon
              icon="solar:map-point-bold"
              height="18"
            />
          </span>
          <span class="bar__text">Публичная</span>
        </button>

        <div class="bar__sep" />

        <button
          class="bar__btn"
          type="button"
          @click="emit('private')"
        >
          <span class="bar__ic bar__ic--private">
            <u-icon
              icon="solar:lock-keyhole-bold"
              height="16"
            />
          </span>
          <span class="bar__text">Личная</span>
        </button>
      </div>

      <span
        class="bar__marker"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span class="bar__marker-core" />
      </span>

      <span
        class="bar__coords"
        :style="coordsStyle"
      >{{ coordsLabel }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bar-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;

  &--closing {
    animation: menu-out 0.2s ease both;
  }
}

.bar {
  position: absolute;
  width: 0;
  height: 0;
}

.bar__panel {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: stretch;
  padding: 5px;
  border-radius: 16px;
  background: var(--bg-color-block);
  border: 0.5px solid var(--border-subtle);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  transition: transform 0.18s ease;
  animation: bar-in 0.24s cubic-bezier(0.3, 1.1, 0.4, 1) 0.1s both;
}

.bar__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 84px;
  padding: 9px 6px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:active {
    background: var(--surface-subtle);
  }
}

.bar__ic {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;

  &--public {
    color: #fff;
    @include gradient();
  }

  &--private {
    color: var(--text-color-secondary);
    background: var(--surface-subtle);
  }
}

.bar__text {
  @include value-text(12px, var(--text-color), 600);
}

.bar__sep {
  width: 1px;
  margin: 6px 2px;
  background: var(--border-subtle);
}

.bar__marker {
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

.bar__marker-core {
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

.bar__marker:active .bar__marker-core {
  transform: scale(1.3);
}

.bar__coords {
  position: absolute;
  left: 0;
  top: 0;
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--bg-color-block);
  border: 0.5px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  white-space: nowrap;
  @include value-text(12px, var(--text-color), 600);
  font-variant-numeric: tabular-nums;
  transition: transform 0.18s ease;
  animation: fade-in 0.3s ease 0.24s both;
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

@keyframes bar-in {
  from {
    opacity: 0;
    scale: 0.9;
  }
  to {
    opacity: 1;
    scale: 1;
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
