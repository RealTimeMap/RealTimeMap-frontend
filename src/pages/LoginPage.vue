<script setup lang="ts">
import ProfileFormView from '@/components/02.features/Authentication/ui/ProfileFormView.vue'
</script>

<template>
  <div class="">
    <div class="auth-bg">
      <div class="glow glow-cyan" />
      <div class="glow glow-purple" />
    </div>
    <div class="auth-content">
      <div class="auth-content__heading">
        <h1>С возвращением</h1>
        <span>
          Войдите, чтобы продолжить исследовать метки на карте
        </span>
      </div>
      <profile-form-view />
    </div>
  </div>
</template>

<style scoped lang="scss">
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

.auth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100dvh;
  gap: 30px;

  &__heading {
    text-align: center;
    max-width: 340px;

    h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: white;
    }

    span {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.4;
    }
  }
}
</style>
