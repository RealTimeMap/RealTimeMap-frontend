<script lang="ts" setup>
const { disabled = false } = defineProps<{
  disabled?: boolean
}>()

const model = defineModel<boolean>({ default: false })

function toggle() {
  if (disabled)
    return
  model.value = !model.value
}
</script>

<template>
  <button
    type="button"
    class="u-switch"
    role="switch"
    :aria-checked="model"
    :disabled="disabled"
    :class="{ 'is-on': model }"
    @click="toggle"
  >
    <span class="u-switch__thumb" />
  </button>
</template>

<style lang="scss" scoped>
.u-switch {
  flex-shrink: 0;
  width: 50px;
  height: 28px;
  padding-left: 2px;
  border-radius: 999px;
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background 0.25s ease;

  &.is-on {
    background: linear-gradient(90deg, #5370f9 0%, #7c4dff 100%);
    box-shadow: none;
    padding: 0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__thumb {
    display: block;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 2px 6px;
    transition: transform 0.25s cubic-bezier(0.3, 1.25, 0.5, 1);
  }

  &.is-on .u-switch__thumb {
    transform: translateX(24px);
  }
}
</style>
