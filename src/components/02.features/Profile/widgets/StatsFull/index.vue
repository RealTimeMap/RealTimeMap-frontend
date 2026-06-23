<script setup lang="ts">
defineProps<{
  userId: number
}>()
</script>

<template>
  <div class="stats-container">
    <u-icon
      icon="arcticons:stats-royale"
      width="16"
    />
    Подробная статистика
  </div>
</template>

<style lang="scss" scoped>
.stats-container {
  width: 90%;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 8px;

  @include glass-panel(12px, 8px 14px, false);

  background: oklch(0.62 0.22 265 / 0.12);
  border: 0.5px solid oklch(0.62 0.22 265 / 0.3);
}
</style>
