<script setup lang="ts">
import type { SplashStyle } from '@/components/00.shared/stores/settings/parts/useExperimental'

const props = withDefaults(defineProps<{
  /** Стиль анимации. */
  variant?: Exclude<SplashStyle, 'off'>
  /** Приложение готово — можно скрывать сплэш. */
  done?: boolean
  /** Максимальная длительность показа, мс (страховка от зависания). */
  maxDuration?: number
}>(), {
  variant: 'spin',
  done: false,
  maxDuration: 4000,
})

const emit = defineEmits<{
  hidden: []
}>()

const animationPlayed = ref(false)
const leaving = ref(false)

let playTimer: ReturnType<typeof setTimeout> | undefined
let maxTimer: ReturnType<typeof setTimeout> | undefined

const ENTER_DURATION = 1900

function tryHide() {
  if (leaving.value)
    return
  if (props.done && animationPlayed.value)
    leaving.value = true
}

function onLeaveEnd() {
  emit('hidden')
}

watch(() => props.done, tryHide)

onMounted(() => {
  playTimer = setTimeout(() => {
    animationPlayed.value = true
    tryHide()
  }, ENTER_DURATION)

  maxTimer = setTimeout(() => {
    animationPlayed.value = true
    leaving.value = true
  }, props.maxDuration)
})

onBeforeUnmount(() => {
  clearTimeout(playTimer)
  clearTimeout(maxTimer)
})
</script>

<template>
  <transition
    name="splash-fade"
    @after-leave="onLeaveEnd"
  >
    <div
      v-if="!leaving"
      class="app-splash"
      :class="`app-splash--${variant}`"
      role="status"
      aria-label="Загрузка приложения"
    >
      <!-- Вариант 1: щит с pin-меткой («метка приземляется») -->
      <svg
        v-if="variant === 'shield'"
        class="app-splash__logo"
        viewBox="0 0 200 220"
        width="140"
        height="154"
        fill="none"
        aria-hidden="true"
      >
        <path
          class="app-splash__shield"
          d="M100 8
             C130 8 150 14 176 22
             C186 25 190 32 190 44
             L190 118
             C190 168 152 198 100 214
             C48 198 10 168 10 118
             L10 44
             C10 32 14 25 24 22
             C50 14 70 8 100 8 Z"
          fill="var(--splash-star)"
        />
        <g class="app-splash__pin">
          <path
            d="M100 44
               C126 44 146 64 146 90
               C146 118 118 142 100 178
               C82 142 54 118 54 90
               C54 64 74 44 100 44 Z"
            fill="var(--splash-star-fill)"
          />
          <circle
            class="app-splash__pin-dot"
            cx="100"
            cy="90"
            r="18"
            fill="var(--splash-core)"
          />
        </g>
        <circle
          class="app-splash__pin-ping"
          cx="100"
          cy="90"
          r="18"
          fill="none"
          stroke="var(--splash-core)"
          stroke-width="3"
        />
      </svg>

      <!-- Варианты 2+: ромб-«искра» -->
      <svg
        v-else
        class="app-splash__logo"
        viewBox="0 0 200 200"
        width="150"
        height="150"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="splash-shine"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stop-color="#fff"
              stop-opacity="0"
            />
            <stop
              offset="50%"
              stop-color="#fff"
              stop-opacity="0.85"
            />
            <stop
              offset="100%"
              stop-color="#fff"
              stop-opacity="0"
            />
          </linearGradient>
        </defs>

        <g class="app-splash__diamond">
          <path
            class="app-splash__star"
            d="M100 12
               Q108 92 188 100
               Q108 108 100 188
               Q92 108 12 100
               Q92 92 100 12 Z"
            fill="var(--splash-star-fill)"
            stroke="var(--splash-star)"
            stroke-width="14"
            stroke-linejoin="round"
          />

          <!-- Блик, пробегающий по грани -->
          <path
            class="app-splash__shine"
            d="M100 12
               Q108 92 188 100
               Q108 108 100 188
               Q92 108 12 100
               Q92 92 100 12 Z"
            fill="url(#splash-shine)"
          />

          <circle
            class="app-splash__core"
            cx="100"
            cy="100"
            r="26"
            fill="var(--splash-core)"
          />
        </g>
      </svg>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.app-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  --splash-star: #16161f;
  --splash-star-fill: #f4f2ee;
  --splash-core: var(--primary-color, #973bff);
  --splash-shadow: rgba(0, 0, 0, 0.3);

  background: var(--bg-body, #101014);
}

:global(html[data-theme='light']) .app-splash {
  --splash-star: #1b1e28;
  --splash-star-fill: #ffffff;
  --splash-shadow: color-mix(in srgb, var(--primary-color) 22%, transparent);
}

.app-splash__logo {
  overflow: visible;
  transform-origin: 50% 50%;
}

.app-splash__diamond {
  transform-origin: 100px 100px;
  transform-box: view-box;
}

.app-splash__core {
  transform-origin: 100px 100px;
  transform-box: view-box;
}

.app-splash__shine {
  transform-box: view-box;
  opacity: 0;
  mix-blend-mode: overlay;
}

.app-splash__logo {
  animation: splash-breathe 2600ms ease-in-out 1400ms infinite;
}

/* ══ Стиль SHIELD (вариант 1): щит + метка приземляется ════════ */
.app-splash--shield {
  .app-splash__shield {
    transform-origin: 50% 55%;
    transform-box: view-box;
    animation: splash-shield-in 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .app-splash__pin {
    transform-origin: 50% 50%;
    transform-box: view-box;
    animation: splash-pin-drop 900ms cubic-bezier(0.34, 1.56, 0.64, 1) 350ms both;
  }
  .app-splash__pin-dot {
    transform-origin: 100px 90px;
    transform-box: view-box;
    animation: splash-core-pop 500ms ease-out 1100ms both;
  }
  .app-splash__pin-ping {
    transform-origin: 100px 90px;
    transform-box: view-box;
    animation: splash-pin-ping 900ms ease-out 1200ms 1 both;
  }
}

@keyframes splash-shield-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes splash-pin-drop {
  0% {
    opacity: 0;
    transform: translateY(-90px) scale(0.85);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes splash-pin-ping {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  8% {
    opacity: 0.55;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(4.2);
  }
}

/* ══ Стиль SPIN: раскрытие с поворотом, бликом и свечением ═════ */
.app-splash--spin {
  .app-splash__diamond {
    animation: splash-spin-open 1300ms cubic-bezier(0.25, 0.9, 0.3, 1) both;
  }
  .app-splash__star {
    animation: splash-spin-glow 1600ms ease-out 500ms both;
  }
  .app-splash__shine {
    animation: splash-spin-shine 1000ms ease-in-out 800ms both;
  }
  .app-splash__core {
    animation:
      splash-spin-core 800ms cubic-bezier(0.25, 1.15, 0.5, 1) 750ms both,
      splash-core-glow 2600ms ease-in-out 1600ms infinite;
  }
}

@keyframes splash-spin-open {
  0% {
    opacity: 0;
    transform: rotate(-60deg) scale(0.6);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}

@keyframes splash-spin-glow {
  0% {
    filter: drop-shadow(0 0 0 transparent);
  }
  45% {
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--splash-core) 45%, transparent));
  }
  100% {
    filter: drop-shadow(0 4px 12px var(--splash-shadow));
  }
}

@keyframes splash-spin-shine {
  0% {
    opacity: 0;
    transform: translate(-60px, -60px);
  }
  45% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: translate(60px, 60px);
  }
}

@keyframes splash-spin-core {
  0% {
    transform: scale(0.4);
  }
  60% {
    transform: scale(1.18);
    filter: brightness(1.4);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

@keyframes splash-core-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 1px var(--splash-core));
  }
  50% {
    filter: drop-shadow(0 0 7px color-mix(in srgb, var(--splash-core) 70%, transparent));
  }
}

@keyframes splash-core-pop {
  0% {
    transform: scale(0);
    filter: brightness(1);
  }
  55% {
    transform: scale(1.3);
    filter: brightness(1.9);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

@keyframes splash-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.035);
  }
}

.splash-fade-leave-active {
  transition:
    opacity 450ms ease,
    transform 450ms ease;
}
.splash-fade-leave-to {
  opacity: 0;
  transform: scale(1.04);
}

/* Уважаем системную настройку «меньше движения» */
@media (prefers-reduced-motion: reduce) {
  .app-splash__logo,
  .app-splash__diamond,
  .app-splash__star,
  .app-splash__core,
  .app-splash__shield,
  .app-splash__pin,
  .app-splash__pin-dot,
  .app-splash__pin-ping {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
  }
  .app-splash__pin-ping,
  .app-splash__shine {
    display: none;
  }
}
</style>
