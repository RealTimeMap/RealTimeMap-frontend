<script setup lang="ts">
</script>

<template>
  <div class="auth-bg">
    <div class="glow glow-cyan" />
    <div class="glow glow-purple" />
  </div>
</template>

<style scoped>
.auth-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(at 20% 15%, oklch(0.62 0.22 220 / 0.35) 0%, transparent 45%),
    radial-gradient(at 90% 70%, oklch(0.4 0.2 290 / 0.5) 0%, transparent 55%),
    linear-gradient(oklch(0.14 0.05 220) 0%, oklch(0.08 0.03 220) 100%);
  overflow: hidden;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  mix-blend-mode: screen;
  will-change: transform;
}

.glow-cyan {
  top: -15%;
  left: -5%;
  width: 70vw;
  height: 70vw;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, transparent 70%);
  animation: move-cyan 18s infinite alternate ease-in-out;
}

.glow-purple {
  bottom: -10%;
  right: -5%;
  width: 80vw;
  height: 80vw;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
  animation: move-purple 22s infinite alternate-reverse ease-in-out;
}

@keyframes move-cyan {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(15%, 10%) scale(1.3);
  }
}

@keyframes move-purple {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(-15%, -10%) scale(1.4);
  }
}
</style>
