<script setup lang="ts">
defineProps<{
  animation?: boolean
}>()
</script>

<template>
  <u-glass-wrapper
    :scale="40"
    class="u-chip"
  >
    <div class="u-chip__content">
      <slot />
    </div>
  </u-glass-wrapper>
</template>

<style lang="scss" scoped>
.u-chip {
  position: absolute;
  left: 50%;
  bottom: calc(122px + var(--safe-bottom));
  transform: translateX(-50%);
  z-index: 10;
  animation: 4s ease-in-out infinite hintFloat;
  border-radius: 999px;

  &__content {
    position: relative;
    overflow: hidden;
    border: 0.5px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      rgba(255, 255, 255, 0.06) 0px 1px 0px inset,
      rgba(0, 0, 0, 0.35) 0px 10px 30px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
  }
}

@keyframes hintFloat {
  0% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-10px);
  }
  100% {
    transform: translateX(-50%) translateY(0);
  }
}
</style>
