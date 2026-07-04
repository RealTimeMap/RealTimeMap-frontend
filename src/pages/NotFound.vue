<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push({ name: 'home-map' })
}
</script>

<template>
  <div class="not-found-page">
    <div class="auth-bg">
      <div class="glow glow-cyan" />
      <div class="glow glow-purple" />
    </div>

    <div class="not-found-content">
      <div class="not-found-content__code">
        404
      </div>

      <div class="not-found-content__heading">
        <h1>Страница не найдена</h1>
        <p>
          Кажется, вы заблудились. Той страницы, которую вы ищете, не существует или она была перемещена.
        </p>
      </div>

      <button
        type="button"
        class="button primary"
        @click="goHome"
      >
        Вернуться на карту
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100dvh;
  overflow: hidden;
}

.auth-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(at 20% 15%, oklch(0.62 0.22 220 / 0.35) 0%, transparent 45%),
    radial-gradient(at 90% 70%, oklch(0.4 0.2 290 / 0.5) 0%, transparent 55%),
    linear-gradient(oklch(0.14 0.05 220) 0%, oklch(0.08 0.03 220) 100%);
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
  background: radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%);
  animation: move-cyan 18s infinite alternate ease-in-out;
}

.glow-purple {
  bottom: -10%;
  right: -5%;
  width: 80vw;
  height: 80vw;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  animation: move-purple 22s infinite alternate-reverse ease-in-out;
}

@keyframes move-cyan {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(15%, 10%) scale(1.2);
  }
}

@keyframes move-purple {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(-15%, -10%) scale(1.3);
  }
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
  width: 90%;
  gap: 24px;
  z-index: 1;

  &__code {
    font-size: 96px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -2px;
    background: linear-gradient(135deg, rgb(255, 255, 255) 30%, var(--primary-color) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 4px 12px rgba(6, 182, 212, 0.15));
  }

  &__heading {
    h1 {
      @include value-text(24px, white);
      margin-bottom: 8px;
    }

    p {
      @include label-text(14px, none, rgba(255, 255, 255, 0.6));
      line-height: 1.5;
      margin: 0;
    }
  }
}
</style>
