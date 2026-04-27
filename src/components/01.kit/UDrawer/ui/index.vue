<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <div
    class="u-drawer"
    :class="{ 'u-drawer--has-text': text }"
  >
    <span
      v-if="text"
      class="u-drawer__text"
    >
      {{ text }}
    </span>
  </div>
</template>

<style scoped>
.u-drawer {
  display: flex;
  align-items: center;
  width: 100%;
}

.u-drawer::before,
.u-drawer::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.u-drawer:not(.u-drawer--has-text)::after {
  display: none;
}

.u-drawer__text {
  padding: 0 12px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  font-weight: 500;
  text-transform: lowercase;
  white-space: nowrap;
}
</style>
