<script setup lang="ts">
import { useOnboarding } from '@/components/02.features/Onboarding/model/useOnboarding'

const { completeOnboarding } = useOnboarding()
const currentIndex = ref(0)
const totalSlides = 3

interface SnakePath {
  id: number
  d: string
  color: string
  width: number
  duration: number
  delay: number
}
const snakes = ref<SnakePath[]>([])

const random = (min: number, max: number) => Math.random() * (max - min) + min

const COLORS = ['#2080f0', '#18a058', '#d03050', '#f0a020']

onMounted(() => {
  const width = window.innerWidth
  const height = window.innerHeight
  const count = 12

  snakes.value = Array.from({ length: count }).map((_, i) => {
    const startY = random(0, height)
    const endY = random(0, height)
    const cp1x = width * 0.3
    const cp1y = random(0, height)
    const cp2x = width * 0.7
    const cp2y = random(0, height)
    const pathData = `M -100,${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${width + 100},${endY}`

    return {
      id: i,
      d: pathData,
      color: COLORS[Math.floor(random(0, COLORS.length))] as string,
      width: random(3, 6),
      duration: random(8, 15),
      delay: random(0, 5),
    }
  })
})

const slides = [
  { key: 'about', color: '#2080f0', icon: 'line-md:map-marker-twotone-loop' },
  { key: 'team', color: '#18a058', icon: 'line-md:laptop-twotone' },
  { key: 'safety', color: '#d03050', icon: 'line-md:alert-twotone-loop' },
]

const isLastSlide = computed(() => currentIndex.value === totalSlides - 1)

function handleNext() {
  if (isLastSlide.value) {
    completeOnboarding()
  }
  else {
    currentIndex.value++
  }
}

function openGithub() {
  window.open('https://github.com/RealTimeMap', '_blank')
}
</script>

<template>
  <div class="welcome-container">
    <svg class="snake-background">
      <g
        v-for="snake in snakes"
        :key="snake.id"
      >
        <path
          :d="snake.d"
          fill="none"
          :stroke="snake.color"
          :stroke-width="snake.width"
          opacity="0.1"
        />

        <path
          class="snake-runner"
          :d="snake.d"
          fill="none"
          :stroke="snake.color"
          :stroke-width="snake.width"
          stroke-linecap="round"
          :style="{
            animationDuration: `${snake.duration}s`,
            animationDelay: `-${snake.delay}s`,
          }"
        />
      </g>
    </svg>

    <div class="welcome-card-glass">
      <div class="card-layout">
        <div class="welcome-carousel-viewport">
          <transition
            name="slide-fade"
            mode="out-in"
          >
            <!-- Слайд 1: О приложении -->
            <div
              v-if="currentIndex === 0"
              key="about"
              class="slide-wrapper"
            >
              <div class="slide-scroll-area">
                <div
                  class="icon-box"
                  :style="{ background: `rgba(32, 128, 240, 0.1)`, color: '#2080f0' }"
                >
                  <u-icon
                    :icon="slides[0].icon"
                    height="56"
                    width="56"
                  />
                </div>

                <h1 class="slide-title">
                  RealTimeMap
                </h1>
                <p class="description">
                  Интерактивная карта для обмена событиями и координатами в реальном времени.
                </p>

                <div class="features-list">
                  <div class="feature-item">
                    <div class="feature-icon">
                      📍
                    </div>
                    <div class="feature-text">
                      <strong>Геолокация</strong>
                      <span>Точная привязка событий к карте</span>
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">
                      ⚡
                    </div>
                    <div class="feature-text">
                      <strong>Live Sync</strong>
                      <span>Мгновенное обновление данных (WebSocket)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Слайд 2: Стек -->
            <div
              v-else-if="currentIndex === 1"
              key="stack"
              class="slide-wrapper"
            >
              <div class="slide-scroll-area">
                <div
                  class="icon-box"
                  :style="{ background: `rgba(24, 160, 88, 0.1)`, color: '#18a058' }"
                >
                  <u-icon
                    :icon="slides[1].icon"
                    height="56"
                    width="56"
                  />
                </div>

                <h2 class="slide-title">
                  Технологии
                </h2>
                <p class="description">
                  Проект создан энтузиастами для изучения современных архитектурных решений.
                </p>

                <div class="stack-section">
                  <div class="stack-group">
                    <span class="stack-label">Frontend</span>
                    <div class="tags-row">
                      <span class="u-tag u-tag--success">Vue 3</span>
                      <span class="u-tag u-tag--success">TypeScript</span>
                      <span class="u-tag u-tag--success">Vite</span>
                    </div>
                  </div>

                  <div class="stack-group">
                    <span class="stack-label">Backend</span>
                    <div class="tags-row">
                      <span class="u-tag u-tag--info">Golang (Gin)</span>
                      <span class="u-tag u-tag--info">Python (FastAPI)</span>
                    </div>
                  </div>

                  <div class="stack-group">
                    <span class="stack-label">Infrastructure</span>
                    <div class="tags-row">
                      <span class="u-tag u-tag--warning">PostgreSQL</span>
                      <span class="u-tag u-tag--error">Kafka</span>
                      <span class="u-tag u-tag--primary">gRPC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Слайд 3: Важно -->
            <div
              v-else-if="currentIndex === 2"
              key="safety"
              class="slide-wrapper"
            >
              <div class="slide-scroll-area">
                <div
                  class="icon-box"
                  :style="{ background: `rgba(208, 48, 80, 0.1)`, color: '#d03050' }"
                >
                  <u-icon
                    :icon="slides[2].icon"
                    height="56"
                    width="56"
                  />
                </div>

                <h2 class="slide-title">
                  Внимание
                </h2>

                <div class="safety-alert-custom">
                  <div style="font-weight: 600; margin-bottom: 4px;">
                    ⚠️ Work in Progress
                  </div>
                  Приложение в активной разработке. Возможны сбои и очистка данных.
                </div>

                <div class="rules-block">
                  <ul class="u-ul">
                    <li class="u-li">
                      Нажимая "Начать", вы принимаете правила.
                    </li>
                    <li class="u-li">
                      Не передавайте доступ третьим лицам.
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  class="github-link-btn"
                  @click="openGithub"
                >
                  <u-icon
                    icon="line-md:github-loop"
                    height="16"
                    width="16"
                  />
                  GitHub Repo
                </button>
              </div>
            </div>
          </transition>
        </div>

        <div class="footer-actions glass-footer">
          <button
            type="button"
            class="button primary action-btn"
            @click="handleNext"
          >
            {{ isLastSlide ? 'Начать использование' : 'Далее' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.welcome-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 16px;
  overflow: hidden;
}

/* --- Змейки --- */
.snake-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.snake-runner {
  stroke-dasharray: 150 1800;
  stroke-dashoffset: 1950;
  animation: snakeMove linear infinite;
  will-change: stroke-dashoffset;
}

@keyframes snakeMove {
  to {
    stroke-dashoffset: -1950;
  }
}

/* --- Glassmorphism Card --- */
.welcome-card-glass {
  width: 100%;
  max-width: 440px;
  height: 650px;
  max-height: 90vh;
  border-radius: 32px;
  background: var(--glass-background);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.card-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.welcome-carousel-viewport {
  flex: 1;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* --- Слайды --- */
.slide-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.slide-scroll-area {
  flex: 1;
  padding: 40px 24px 10px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.icon-box {
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
}

.slide-title {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--text-color);
  letter-spacing: -0.5px;
}

.description {
  font-size: 15px;
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 32px;
  line-height: 1.6;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);

  .feature-icon {
    font-size: 22px;
  }
  .feature-text {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    strong {
      margin-bottom: 2px;
      color: var(--text-color);
    }
    span {
      color: var(--text-color);
      opacity: 0.7;
    }
  }
}

/* --- Стек и Кастомные теги --- */
.stack-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stack-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.stack-label {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-color);
  opacity: 0.5;
  margin-left: 4px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.u-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-color);
  border: 1px solid rgba(255, 255, 255, 0.08);

  &--success {
    color: #18a058;
    background: rgba(24, 160, 88, 0.1);
  }
  &--info {
    color: #2080f0;
    background: rgba(32, 128, 240, 0.1);
  }
  &--warning {
    color: #f0a020;
    background: rgba(240, 160, 32, 0.1);
  }
  &--error {
    color: #d03050;
    background: rgba(208, 48, 80, 0.1);
  }
  &--primary {
    color: #7aafeb;
    background: rgba(122, 175, 235, 0.1);
  }
}

/* --- Блок предупреждений --- */
.safety-alert-custom {
  width: 100%;
  text-align: left;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  background: rgba(240, 160, 32, 0.1);
  color: #f0a020;
  border: 1px solid rgba(240, 160, 32, 0.2);
  font-size: 14px;
  line-height: 1.5;
}

.rules-block {
  text-align: left;
  font-size: 14px;
  color: var(--text-color);
  width: 100%;
  margin-bottom: 24px;

  .u-ul {
    padding-left: 20px;
    margin: 0;
  }
  .u-li {
    margin-bottom: 8px;
    opacity: 0.8;
  }
}

.github-link-btn {
  margin-top: auto;
  background: transparent;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
  opacity: 0.6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

/* --- Футер --- */
.footer-actions {
  flex-shrink: 0;
  padding: 24px;
  padding-top: 16px;
}

.action-btn {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
}

/* --- Анимация кастомных переходов слайдов --- */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease-in-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
