<script setup lang="ts">
defineProps<{
  show: boolean
}>()
</script>

<template>
  <transition name="panel-slide-up">
    <u-glass-wrapper
      v-if="show"
      :scale="20"
      class="app-panel"
    >
      <slot />
    </u-glass-wrapper>
  </transition>
</template>

<style lang="scss" scoped>
.app-panel {
  position: fixed !important;
  bottom: 130px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  padding: 1.5rem;
  border-radius: 20px;
  background-color: var(--bg-color-soft);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 900;
}

.panel-slide-up-enter-active,
.panel-slide-up-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-slide-up-enter-from,
.panel-slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(30px);
}
</style>
