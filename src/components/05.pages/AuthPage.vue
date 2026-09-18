<script setup lang="ts">
import { setTransparentStatusBar } from '@/components/00.shared/lib/statusBar'
import { initTheme, readSavedPreference, resolvePreference, themeBase } from '@/components/00.shared/lib/theme'
import ProfileFormView from '@/components/02.features/Authentication/index'

onMounted(() => {
  setTransparentStatusBar(themeBase(resolvePreference(readSavedPreference())))
})

onBeforeUnmount(() => {
  initTheme()
})
</script>

<template>
  <div class="auth-container">
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
.auth-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.auth-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: var(--auth-bg);
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
  background: radial-gradient(circle, color-mix(in srgb, var(--secondary-color) 45%, transparent) 0%, transparent 70%);
  animation: move-cyan 18s infinite alternate ease-in-out;
}

.glow-purple {
  bottom: -10%;
  right: -5%;
  width: 80vw;
  height: 80vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--primary-color) 40%, transparent) 0%, transparent 70%);
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
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: calc(100dvh - var(--safe-top));
  gap: 30px;
  max-width: 500px;
  width: 90%;
  margin: 0 auto;

  &__heading {
    text-align: center;
    max-width: 340px;

    h1 {
      @include value-text(28px, var(--text-color));
    }

    span {
      @include label-text(14px, none, var(--text-color-secondary));
      letter-spacing: normal;
    }
  }
}
</style>
