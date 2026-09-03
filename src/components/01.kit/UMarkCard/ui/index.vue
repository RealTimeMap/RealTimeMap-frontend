<script setup lang="ts">
import type { Mark } from '@/components/00.shared/services/mark/index.type'

defineProps<{
  mark: Mark
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="mark-card"
    type="button"
    @click="emit('click')"
  >
    <div class="mark-card__media">
      <img
        v-if="mark.photos && mark.photos.length > 0"
        :src="mark.photos[0]"
        class="mark-card__img"
        alt=""
      >
      <div
        v-else
        class="mark-card__placeholder"
      >
        <u-icon
          icon="solar:map-point-bold"
          height="26"
        />
      </div>

      <div
        v-if="mark.photos && mark.photos.length > 1"
        class="mark-card__count"
      >
        <u-icon
          icon="solar:gallery-bold"
          width="12"
          height="12"
        />
        {{ mark.photos.length }}
      </div>
    </div>

    <div class="mark-card__body">
      <span class="mark-card__title">{{ mark.markName }}</span>
    </div>
  </button>
</template>

<style scoped lang="scss">
.mark-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0;
  overflow: hidden;
  border-radius: 16px;
  background: var(--bg-color-block);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;

  box-shadow:
    var(--glass-shadow-inset) 0px 1px 0px inset,
    var(--glass-shadow) 0px 10px 30px;

  &:active {
    transform: scale(0.97);
  }
}

.mark-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 1.5 / 1;
  overflow: hidden;
}

.mark-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mark-card__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-color-muted);
  background: var(--bg-color-block);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      color-mix(in srgb, var(--text-color) 4%, transparent) 10px,
      color-mix(in srgb, var(--text-color) 4%, transparent) 20px
    );
    pointer-events: none;
  }
}

.mark-card__count {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  line-height: 1;
}

.mark-card__body {
  padding: 10px 12px 12px;
}

.mark-card__title {
  @include value-text(15px, var(--text-color), 700);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
