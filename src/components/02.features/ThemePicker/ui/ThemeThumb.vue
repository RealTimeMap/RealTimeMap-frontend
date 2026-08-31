<script setup lang="ts">
import type { ThemeMeta } from '@/components/00.shared/lib/theme'

defineProps<{
  theme: ThemeMeta
  active: boolean
}>()

defineEmits<{ select: [] }>()
</script>

<template>
  <button
    class="theme-thumb"
    :class="{ 'theme-thumb--active': active }"
    type="button"
    @click="$emit('select')"
  >
    <div
      class="theme-thumb__swatch"
      :class="`theme-${theme.id}`"
    >
      <span class="theme-thumb__dot theme-thumb__dot--bg" />
      <span class="theme-thumb__dot theme-thumb__dot--accent" />
      <div
        v-if="active"
        class="theme-thumb__check"
      >
        <u-icon
          icon="material-symbols:check-rounded"
          height="12"
        />
      </div>
    </div>
    <span class="theme-thumb__label">{{ theme.label }}</span>
  </button>
</template>

<style lang="scss" scoped>
.theme-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  &__swatch {
    position: relative;
    width: 82px;
    height: 82px;
    border-radius: 18px;
    background: var(--bg-body);
    border: 2px solid var(--border-subtle);
    box-shadow: var(--glass-shadow) 0px 4px 10px;
    transition:
      border-color 0.2s ease,
      transform 0.2s ease;
    overflow: hidden;
  }

  &__dot {
    position: absolute;
    border-radius: 999px;

    &--bg {
      top: 22px;
      left: 18px;
      width: 38px;
      height: 8px;
      background: var(--text-color);
      opacity: 0.35;
    }

    &--accent {
      bottom: 20px;
      right: 14px;
      width: 44px;
      height: 10px;
      background: var(--primary-color);
    }
  }

  &__check {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    color: #fff;
    background: var(--primary-color);
  }

  &__label {
    @include value-text(14px, var(--text-color), 600);
  }

  &--active &__swatch {
    border-color: var(--primary-color);
    transform: translateY(-2px);
  }
}
</style>
