<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="settings-section">
    <h3 class="settings-section__title">
      {{ title }}
    </h3>
    <div class="settings-group">
      <slot />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.settings-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__title {
    @include label-text(12px, uppercase);
    padding-left: 4px;
  }
}

.settings-group {
  width: 100%;
  overflow: hidden;
  @include glass-panel(16px, 0, false, false);
}
</style>
