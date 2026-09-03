<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message?: string
  retrying?: boolean
  compact?: boolean
}>(), {
  title: 'Не удалось загрузить',
  message: 'Сервис временно недоступен',
  retrying: false,
  compact: false,
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="u-block-error"
    :class="{ 'u-block-error--compact': compact }"
  >
    <u-icon
      class="u-block-error__icon"
      icon="solar:danger-triangle-bold-duotone"
      :width="compact ? 22 : 26"
      :height="compact ? 22 : 26"
    />
    <div class="u-block-error__text">
      <span class="u-block-error__title">{{ title }}</span>
      <span
        v-if="!compact"
        class="u-block-error__msg"
      >{{ message }}</span>
    </div>
    <button
      type="button"
      class="u-block-error__retry"
      :disabled="retrying"
      @click="emit('retry')"
    >
      <u-icon
        :icon="retrying ? 'line-md:loading-twotone-loop' : 'solar:refresh-linear'"
        width="15"
        height="15"
      />
      Повторить
    </button>
  </div>
</template>

<style scoped lang="scss">
.u-block-error {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 18px 16px;

  &__icon {
    color: var(--warning-color, #e6a23c);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
  }

  &__msg {
    font-size: 12px;
    color: var(--text-color-secondary);
    line-height: 1.4;
  }

  &__retry {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 2px;
    padding: 7px 14px;
    border-radius: 999px;
    border: 0.5px solid var(--border-subtle);
    background: var(--surface-subtle);
    color: var(--text-color);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }

    &:active:not(:disabled) {
      transform: scale(0.96);
    }
  }

  &--compact {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
    text-align: left;

    .u-block-error__text {
      flex: 1;
      min-width: 0;
    }

    .u-block-error__retry {
      margin-top: 0;
    }
  }
}
</style>
