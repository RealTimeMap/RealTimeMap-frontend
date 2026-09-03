<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  hint?: string
  link?: boolean
  chevron?: string
}>(), {
  hint: undefined,
  link: false,
  chevron: 'line-md:chevron-right',
})

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <component
    :is="link ? 'button' : 'div'"
    class="settings-row"
    :class="{ 'settings-row--link': link }"
    :type="link ? 'button' : undefined"
    @click="link && emit('click')"
  >
    <div class="settings-row__text">
      <span class="settings-row__label">{{ label }}</span>
      <span
        v-if="hint"
        class="settings-row__hint"
      >{{ hint }}</span>
    </div>

    <slot name="trailing">
      <u-icon
        v-if="link"
        class="settings-row__chevron"
        :icon="chevron"
        height="20"
      />
    </slot>
  </component>
</template>

<style lang="scss" scoped>
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px;

  & + & {
    border-top: 1px solid var(--glass-border);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  &__label {
    @include value-text(15px, var(--text-color), 600);
  }

  &__hint {
    @include label-text(12px, none);
    font-variant-numeric: tabular-nums;
  }

  &--link {
    cursor: pointer;
    text-align: left;
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;

    &:active {
      background: color-mix(in srgb, var(--text-color) 5%, transparent);
    }
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--text-color-secondary, var(--text-color-secondary));
  }
}
</style>
