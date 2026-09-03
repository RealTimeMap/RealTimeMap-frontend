<script setup lang="ts">
defineProps<{
  amount: number
}>()
</script>

<template>
  <teleport to="body">
    <div class="xp-gain">
      <span class="xp-gain__pill">
        <u-icon
          icon="solar:star-bold"
          width="16"
          height="16"
        />
        +{{ amount }} XP
      </span>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.xp-gain {
  position: fixed;
  top: 32%;
  left: 50%;
  z-index: 10001;
  transform: translateX(-50%);
  pointer-events: none;

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 999px;
    color: #fff;
    white-space: nowrap;
    @include value-text(16px, #fff, 800);
    @include gradient();
    animation: xp-pop 1.9s ease forwards;
  }
}

@keyframes xp-pop {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.8);
  }
  15% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  70% {
    opacity: 1;
    transform: translateY(-8px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(0.95);
  }
}
</style>
