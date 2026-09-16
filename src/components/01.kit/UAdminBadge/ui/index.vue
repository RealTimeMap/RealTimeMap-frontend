<script lang="ts" setup>
const { size = 16, withLabel = false } = defineProps<{
  /** Размер эмблемы в px. */
  size?: number
  /** Показать текстовую подпись «Админ» рядом с эмблемой. */
  withLabel?: boolean
}>()
</script>

<template>
  <span
    class="u-admin-badge"
    role="img"
    aria-label="Администратор"
    title="Администратор"
  >
    <span class="u-admin-badge__emblem">
      <u-icon
        icon="app:admin-loop"
        :width="size"
        :height="size"
      />
    </span>
    <span
      v-if="withLabel"
      class="u-admin-badge__label"
    >
      Админ
    </span>
  </span>
</template>

<style lang="scss" scoped>
.u-admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  vertical-align: middle;

  &__emblem {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);

    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: var(--accent-gradient, linear-gradient(135deg, oklch(0.62 0.22 265), oklch(0.48 0.2 285)));
      opacity: 0.22;
      filter: blur(4px);
      pointer-events: none;
      z-index: -1;
    }
  }

  &__label {
    @include label-text(12px, none, var(--primary-color));
    line-height: 1;
  }
}
</style>
