<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCarousel,
  NH1,
  NH2,
  NLi,
  NP,
  NTag,
  NUl,
} from 'naive-ui'
import { useOnboarding } from '@/components/02.features/onboarding/model/useOnboarding'

const { completeOnboarding } = useOnboarding()
const carouselRef = ref<any>(null)
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

onMounted(() => {
  const width = window.innerWidth
  const height = window.innerHeight
  const count = 6

  const colors = ['#2080f0', '#18a058', '#d03050', '#f0a020']

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
      color: colors[Math.floor(random(0, colors.length))],
      width: random(3, 6),
      duration: random(8, 15),
      delay: random(0, 5),
    }
  })
})

const slides = [
  { key: 'about', color: '#2080f0', icon: 'mdi:map-marker-radius' },
  { key: 'team', color: '#18a058', icon: 'mdi:code-braces' },
  { key: 'safety', color: '#d03050', icon: 'mdi:shield-alert' },
]

const isLastSlide = computed(() => currentIndex.value === totalSlides - 1)

function handleNext() {
  if (isLastSlide.value) {
    completeOnboarding()
  }
  else {
    carouselRef.value?.next()
  }
}

function handleUpdateIndex(index: number) {
  currentIndex.value = index
}

function openGithub() {
  window.open('https://github.com/RealTimeMap', '_blank')
}
</script>

<template>
  <div class="welcome-container">
    <!-- Змейки на фоне -->
    <svg class="snake-background">
      <g
        v-for="snake in snakes"
        :key="snake.id"
      >
        <!-- Полупрозрачный трек -->
        <path
          :d="snake.d"
          fill="none"
          :stroke="snake.color"
          :stroke-width="snake.width"
          opacity="0.05"
        />
        <!-- Светящаяся голова -->
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

    <div
      class="welcome-card-glass"
    >
      <div class="card-layout">
        <n-carousel
          ref="carouselRef"
          show-dots
          :touchable="false"
          :draggable="false"
          effect="fade"
          class="welcome-carousel"
          @update:current-index="handleUpdateIndex"
        >
          <!-- Слайд 1: О приложении -->
          <div class="slide-wrapper">
            <div class="slide-scroll-area">
              <div
                class="icon-box"
                :style="{ background: `rgba(32, 128, 240, 0.1)`, color: '#2080f0' }"
              >
                <u-icon
                  :icon="slides[0].icon"
                  size="56"
                />
              </div>

              <n-h1 class="slide-title">
                RealTimeMap
              </n-h1>
              <n-p class="description">
                Интерактивная карта для обмена событиями и координатами в реальном времени.
              </n-p>

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
          <div class="slide-wrapper">
            <div class="slide-scroll-area">
              <div
                class="icon-box"
                :style="{ background: `rgba(24, 160, 88, 0.1)`, color: '#18a058' }"
              >
                <u-icon
                  :icon="slides[1].icon"
                  size="56"
                />
              </div>

              <n-h2 class="slide-title">
                Технологии
              </n-h2>
              <n-p class="description">
                Проект создан энтузиастами для изучения современных архитектурных решений.
              </n-p>

              <div class="stack-section">
                <div class="stack-group">
                  <span class="stack-label">Frontend</span>
                  <div class="tags-row">
                    <n-tag
                      :bordered="false"
                      type="success"
                      size="small"
                      round
                    >
                      Vue 3
                    </n-tag>
                    <n-tag
                      :bordered="false"
                      type="success"
                      size="small"
                      round
                    >
                      TypeScript
                    </n-tag>
                    <n-tag
                      :bordered="false"
                      type="success"
                      size="small"
                      round
                    >
                      Vite
                    </n-tag>
                  </div>
                </div>

                <div class="stack-group">
                  <span class="stack-label">Backend</span>
                  <div class="tags-row">
                    <n-tag
                      :bordered="false"
                      type="info"
                      size="small"
                      round
                    >
                      Golang (Gin)
                    </n-tag>
                    <n-tag
                      :bordered="false"
                      type="info"
                      size="small"
                      round
                    >
                      Python (FastAPI)
                    </n-tag>
                  </div>
                </div>

                <div class="stack-group">
                  <span class="stack-label">Infrastructure</span>
                  <div class="tags-row">
                    <n-tag
                      :bordered="false"
                      type="warning"
                      size="small"
                      round
                    >
                      PostgreSQL
                    </n-tag>
                    <n-tag
                      :bordered="false"
                      type="error"
                      size="small"
                      round
                    >
                      Kafka
                    </n-tag>
                    <n-tag
                      type="primary"
                      size="small"
                      round
                    >
                      gRPC
                    </n-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Слайд 3: Важно -->
          <div class="slide-wrapper">
            <div class="slide-scroll-area">
              <div
                class="icon-box"
                :style="{ background: `rgba(208, 48, 80, 0.1)`, color: '#d03050' }"
              >
                <u-icon
                  :icon="slides[2].icon"
                  size="56"
                />
              </div>

              <n-h2 class="slide-title">
                Внимание
              </n-h2>

              <n-alert
                type="warning"
                class="safety-alert"
                :show-icon="false"
              >
                <div style="font-weight: 600; margin-bottom: 4px;">
                  ⚠️ Work in Progress
                </div>
                Приложение в активной разработке. Возможны сбои и очистка данных.
              </n-alert>

              <div class="rules-block">
                <n-ul>
                  <n-li>Нажимая "Начать", вы принимаете правила.</n-li>
                  <n-li>Не передавайте доступ третьим лицам.</n-li>
                </n-ul>
              </div>

              <n-button
                text
                tag="a"
                class="github-link"
                @click="openGithub"
              >
                <template #icon>
                  <u-icon icon="mdi:github" />
                </template>
                GitHub Repo
              </n-button>
            </div>
          </div>
        </n-carousel>

        <!-- Футер тоже стеклянный -->
        <div class="footer-actions glass-footer">
          <n-button
            type="primary"
            size="large"
            block
            round
            class="action-btn"
            @click="handleNext"
          >
            {{ isLastSlide ? 'Начать использование' : 'Далее' }}
          </n-button>
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
  min-height: 100vh;
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
  filter: drop-shadow(0 0 5px currentColor);
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
  backdrop-filter: blur(4px);

  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.card-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.welcome-carousel {
  flex: 1;
  width: 100%;
}

/* --- Слайды --- */
.slide-wrapper {
  height: 100%;
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

  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.03);
}

.slide-title {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--n-text-color);
  letter-spacing: -0.5px;
}

.description {
  font-size: 15px;
  color: #666;
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
  transition: transform 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.5);

  .feature-icon {
    font-size: 22px;
  }
  .feature-text {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    strong {
      margin-bottom: 2px;
    }
    span {
      color: var(--text-color);
    }
  }
}

/* --- Стек --- */
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
  color: #999;
  margin-left: 4px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.safety-alert {
  width: 100%;
  text-align: left;
  border-radius: 16px;
  margin-bottom: 20px;
}

.rules-block {
  text-align: left;
  font-size: 14px;
  color: #555;
  width: 100%;
  margin-bottom: 24px;
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
  }
}

.github-link {
  margin-top: auto;
  color: #555;
  opacity: 0.8;
  transition: all 0.2s;
  &:hover {
    opacity: 1;
    transform: translateY(-1px);
  }
}

/* --- Футер --- */
.footer-actions {
  flex-shrink: 0;
  padding: 24px;
  padding-top: 32px;
  z-index: 5;
}

.action-btn {
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(32, 128, 240, 0.25);
}

:deep(.n-carousel__dots) {
  display: none;
}
</style>
