<script setup lang="ts">
defineProps<{
  text: string
  icon?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div class="coach-hint">
    <span
      v-if="icon"
      class="coach-hint__icon"
    >
      <u-icon
        :icon="icon"
        width="20"
        height="20"
      />
    </span>
    <p class="coach-hint__text">
      {{ text }}
    </p>
    <button
      class="coach-hint__close"
      type="button"
      aria-label="Скрыть подсказку"
      @click="emit('close')"
    >
      <u-icon
        icon="line-md:close"
        width="16"
        height="16"
      />
    </button>
  </div>
</template>

<style scoped lang="scss">
.coach-hint {
  @include glass-panel(16px, 12px 14px, false);
  position: fixed;
  left: 50%;
  bottom: calc(120px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 900;
  width: 90%;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 12px;

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    color: #fff;
    @include gradient();
  }

  &__text {
    flex: 1;
    margin: 0;
    @include value-text(13.5px, var(--text-color), 500);
    line-height: 1.4;
  }

  &__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 8px;
    background: color-mix(in srgb, var(--text-color) 6%, transparent);
    color: var(--text-color-secondary, var(--text-color));
    cursor: pointer;
  }
}
</style>
