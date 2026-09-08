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

const CARD_HALF = 96
const COORDS_HALF = 84
const MARKER_GAP = 26
const COORDS_GAP = 30
const CARD_EST_H = 100

const layout = computed(() => {
  const vw = window.innerWidth
  const above = pos.y - CARD_EST_H - MARKER_GAP > MENU_TOP_RESERVE
  const cardShiftX = clamp(pos.x, MENU_MARGIN + CARD_HALF, vw - MENU_MARGIN - CARD_HALF) - pos.x
  const tailX = clamp(-cardShiftX, -(CARD_HALF - 20), CARD_HALF - 20)
  const coordsShiftX = clamp(pos.x, MENU_MARGIN + COORDS_HALF, vw - MENU_MARGIN - COORDS_HALF) - pos.x
  return { above, cardShiftX, tailX, coordsShiftX }
})

const cardStyle = computed(() => {
  const { above, cardShiftX } = layout.value
  return above
    ? { transform: `translate(-50%, -100%) translate(${cardShiftX}px, -${MARKER_GAP}px)` }
    : { transform: `translate(-50%, 0) translate(${cardShiftX}px, ${MARKER_GAP}px)` }
})

const coordsStyle = computed(() => {
  const { above, coordsShiftX } = layout.value
  const dy = above ? COORDS_GAP : -COORDS_GAP
  return { transform: `translate(-50%, -50%) translate(${coordsShiftX}px, ${dy}px)` }
})
</script>

<template>
  <div
    class="mark-pop-overlay"
    :class="{ 'mark-pop-overlay--closing': closing }"
    @pointerdown.self="requestClose"
  >
    <div
      class="mark-pop"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    >
      <div
        class="mark-pop__card"
        :class="{ 'mark-pop__card--below': !layout.above }"
        :style="cardStyle"
      >
        <button
          class="mark-pop__opt"
          type="button"
          @click="emit('public')"
        >
          <span class="mark-pop__ic mark-pop__ic--public">
            <u-icon
              icon="solar:map-point-bold"
              height="18"
            />
          </span>
          <span class="mark-pop__text">Публичная</span>
          <u-icon
            class="mark-pop__chevron"
            icon="line-md:chevron-right"
            height="16"
          />
        </button>

        <div class="mark-pop__divider" />

        <button
          class="mark-pop__opt"
          type="button"
          @click="emit('private')"
        >
          <span class="mark-pop__ic mark-pop__ic--private">
            <u-icon
              icon="solar:lock-keyhole-bold"
              height="16"
            />
          </span>
          <span class="mark-pop__text">Личная</span>
          <span class="mark-pop__soon">скоро</span>
        </button>

        <span
          class="mark-pop__tail"
          :style="{ left: `calc(50% + ${layout.tailX}px)` }"
        />
      </div>

      <span
        class="mark-pop__marker"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span class="mark-pop__marker-core" />
      </span>

      <span
        class="mark-pop__coords"
        :style="coordsStyle"
      >{{ coordsLabel }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mark-pop-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;

  &--closing {
    animation: menu-out 0.2s ease both;
  }
}

.mark-pop {
  position: absolute;
  width: 0;
  height: 0;
}

.mark-pop__card {
  position: absolute;
  left: 0;
  top: 0;
  width: 184px;
  padding: 6px;
  border-radius: 16px;
  background: var(--bg-color-block);
  border: 0.5px solid var(--border-subtle);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  transition: transform 0.18s ease;
  transform-origin: bottom center;
  animation: card-in 0.24s cubic-bezier(0.3, 1.1, 0.4, 1) 0.1s both;

  &--below {
    transform-origin: top center;
  }
}

.mark-pop__opt {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 11px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:active {
    background: var(--surface-subtle);
  }
}

.mark-pop__ic {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
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

.mark-pop__text {
  flex: 1;
  text-align: left;
  @include value-text(15px, var(--text-color), 600);
}

.mark-pop__chevron {
  color: var(--text-color-muted);
  flex-shrink: 0;
}

.mark-pop__soon {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--surface-subtle);
  @include label-text(10px, uppercase);
}

.mark-pop__divider {
  height: 1px;
  margin: 2px 10px;
  background: var(--border-subtle);
}

.mark-pop__tail {
  position: absolute;
  bottom: -5px;
  width: 12px;
  height: 12px;
  transform: translateX(-50%) rotate(45deg);
  background: var(--bg-color-block);
  border-right: 0.5px solid var(--border-subtle);
  border-bottom: 0.5px solid var(--border-subtle);

  .mark-pop__card--below & {
    bottom: auto;
    top: -5px;
    border-right: none;
    border-bottom: none;
    border-left: 0.5px solid var(--border-subtle);
    border-top: 0.5px solid var(--border-subtle);
  }
}

.mark-pop__marker {
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

.mark-pop__marker-core {
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

.mark-pop__marker:active .mark-pop__marker-core {
  transform: scale(1.3);
}

.mark-pop__coords {
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

@keyframes card-in {
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
