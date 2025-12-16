<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
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
  const count = 8

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
      width: random(2, 4), // Толщина змейки
      duration: random(5, 12), // Скорость ползания
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
    <svg class="snake-background">
      <defs />

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

    <n-card
      class="welcome-card"
      :bordered="false"
    >
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
              class="icon-wrapper"
              :style="{ color: slides[0].color }"
            >
              <u-icon
                :icon="slides[0].icon"
                size="64"
              />
            </div>
            <n-h1 class="slide-title">
              RealTimeMap
            </n-h1>
            <n-p class="description">
              Публичная карта, на которой пользователи могут оставлять анонимные или подписанные сообщения.
            </n-p>

            <div class="features-list">
              <div class="feature-item">
                <div class="feature-icon">
                  📍
                </div>
                <div class="feature-text">
                  <strong>Геолокация</strong>
                  <span>Все события привязаны к координатам</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  ⏱️
                </div>
                <div class="feature-text">
                  <strong>Real-time</strong>
                  <span>Мгновенное отображение событий</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Слайд 2: Кто мы (Стек) -->
        <div class="slide-wrapper">
          <div class="slide-scroll-area">
            <div
              class="icon-wrapper"
              :style="{ color: slides[1].color }"
            >
              <u-icon
                :icon="slides[1].icon"
                size="64"
              />
            </div>
            <n-h2 class="slide-title">
              Кто мы?
            </n-h2>
            <n-p class="description">
              Команда из 3 человек, которой было нечего делать, и мы решили запилить это приложение для личного и публичного пользования.
            </n-p>

            <div class="stack-section">
              <div class="stack-group">
                <span class="stack-label">Frontend</span>
                <div class="tags-row">
                  <n-tag
                    type="success"
                    size="small"
                    round
                  >
                    Vue 3
                  </n-tag>
                  <n-tag
                    type="success"
                    size="small"
                    round
                  >
                    TypeScript
                  </n-tag>
                </div>
              </div>

              <div class="stack-group">
                <span class="stack-label">Backend</span>
                <div class="tags-row">
                  <n-tag
                    type="info"
                    size="small"
                    round
                  >
                    Golang (Gin)
                  </n-tag>
                  <n-tag
                    type="info"
                    size="small"
                    round
                  >
                    Python (FastAPI)
                  </n-tag>
                </div>
              </div>

              <div class="stack-group">
                <span class="stack-label">Infra & DB</span>
                <div class="tags-row">
                  <n-tag
                    type="warning"
                    size="small"
                    round
                  >
                    PostgreSQL + PostGIS
                  </n-tag>
                  <n-tag
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

        <!-- Слайд 3: Важно знать -->
        <div class="slide-wrapper">
          <div class="slide-scroll-area">
            <div
              class="icon-wrapper"
              :style="{ color: slides[2].color }"
            >
              <u-icon
                :icon="slides[2].icon"
                size="64"
              />
            </div>
            <n-h2 class="slide-title">
              Важно знать
            </n-h2>

            <n-alert
              type="warning"
              class="safety-alert"
              :show-icon="false"
            >
              <template #header>
                ⚠️ Work in Progress
              </template>
              Приложение находится в активной разработке.
            </n-alert>

            <div class="rules-block">
              <n-ul>
                <n-li>При нажатии кнопки "Начать", вы соглашаетесь с правилами сервиса.</n-li>
                <n-li>Не делитесь ссылкой с незнакомцами.</n-li>
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
              Исходный код на GitHub
            </n-button>
          </div>
        </div>
      </n-carousel>

      <div class="footer-actions">
        <n-button
          type="primary"
          size="large"
          block
          class="action-btn"
          @click="handleNext"
        >
          {{ isLastSlide ? 'Начать использование' : 'Далее' }}
        </n-button>
      </div>
    </n-card>
  </div>
</template>

<style lang="scss" scoped>
.welcome-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 16px;
  overflow: hidden;
}

/* --- SVG Анимация (Змейки) --- */
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
  /*
     stroke-dasharray: Длина тела змейки, Длина пробела
     Пример: 150px змея, 1000px пустоты до следующей
  */
  stroke-dasharray: 100 2000;
  stroke-dashoffset: 2100; /* Начинаем за пределами */
  animation: snakeMove linear infinite;
}

@keyframes snakeMove {
  to {
    stroke-dashoffset: -2100; /* Двигаем пунктир вдоль пути */
  }
}

/* --- Карточка --- */
.welcome-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  height: 650px;
  max-height: 90vh;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Эффект стекла (optional) */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);

  :deep(.n-card__content) {
    display: flex;
    flex-direction: column;
    padding: 0;
    height: 100%;
  }
}

.welcome-carousel {
  flex: 1;
  width: 100%;
}

/* --- Скролл контент --- */
.slide-wrapper {
  height: 100%;
  width: 100%;
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

.slide-title {
  margin: 0 0 12px 0;
  font-size: 26px;
  font-weight: 800;
  color: #2c3e50;
}

.description {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
}

.icon-wrapper {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 24px;
  display: inline-flex;
}

/* --- 1 Слайд --- */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  text-align: left;
}

.feature-item {
  display: flex;
  gap: 16px;
  align-items: center;
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;

  .feature-icon {
    font-size: 24px;
  }
  .feature-text {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    strong {
      color: #333;
      font-size: 14px;
      margin-bottom: 2px;
    }
    span {
      color: #888;
    }
  }
}

/* --- 2 Слайд (Стек) --- */
.stack-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stack-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f1f1;
  &:last-child {
    border-bottom: none;
  }
}

.stack-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
  font-weight: 700;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* --- 3 Слайд --- */
.safety-alert {
  text-align: left;
  border-radius: 12px;
  width: 100%;
  margin-bottom: 20px;
}

.rules-block {
  text-align: left;
  font-size: 14px;
  color: #4b5563;
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
  color: #333;
  margin-top: auto;
  opacity: 0.7;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
  }
}

/* --- Футер --- */
.footer-actions {
  flex-shrink: 0;
  padding: 24px;
  padding-top: 40px;
  background: #fff;
  z-index: 5;
}

.action-btn {
  height: 50px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(32, 128, 240, 0.3);
}

:deep(.n-carousel__dots) {
  bottom: 100px !important;
}

:deep(.n-carousel__dot) {
  background-color: #e2e8f0;
}
:deep(.n-carousel__dot--active) {
  background-color: #2080f0;
  width: 20px;
}
</style>
