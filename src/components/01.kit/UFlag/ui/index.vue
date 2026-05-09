<script setup lang="ts">
const props = defineProps<{
  status?: string
}>()

const statusClass = computed(() => props.status ? `u-flag--${props.status}` : '')
</script>

<template>
  <span
    class="u-flag"
    :class="[statusClass]"
  >
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.u-flag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;

  &--Active {
    color: oklch(0.85 0.18 150);
    background: oklch(0.4 0.12 150 / 0.25);
    border: 0.5px solid oklch(0.65 0.18 150 / 0.4);
  }
}
</style>
