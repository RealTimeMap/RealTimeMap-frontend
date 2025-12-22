<script setup lang="ts">
import {
  WarningOutline as WarningIcon,
} from '@vicons/ionicons5'
import {
  NAlert,
  NIcon,
  NSpin,
} from 'naive-ui'

interface Props {
  isLoading: boolean
  error: string | null
}
const props = defineProps<Props>()

const loadingPhrases = [
  'Определяем ваше местоположение...',
  'Ищем вас на карте мира... не двигайтесь!',
  'Калибруем спутники... почти готово.',
  'Следуем за сигналом вашего телефона...',
  'Вы здесь! Или... почти здесь.',
  'Загружаем пиксели для вашей карты.',
  'Рисуем дороги, чтобы вы не заблудились.',
  'Спрашиваем у Siri, где вы находитесь...',
]

const currentPhraseIndex = ref(0)
const currentPhrase = ref(loadingPhrases[0])
const phraseKey = ref(0)
let intervalId: number | undefined

function changePhrase() {
  currentPhraseIndex.value = (currentPhraseIndex.value + 1) % loadingPhrases.length
  currentPhrase.value = loadingPhrases[currentPhraseIndex.value]
  phraseKey.value++
}

watch(() => props.isLoading, (loading) => {
  if (loading) {
    if (intervalId)
      clearInterval(intervalId)
    intervalId = window.setInterval(changePhrase, 5000)
  }
  else {
    if (intervalId)
      clearInterval(intervalId)
  }
}, { immediate: true })

onUnmounted(() => {
  if (intervalId)
    clearInterval(intervalId)
})
</script>

<template>
  <div
    v-if="isLoading || error"
    class="map-state-indicator"
  >
    <div
      v-if="isLoading"
      class="state-content"
    >
      <n-spin
        size="large"
        stroke="#4A90E2"
      />
      <p
        :key="phraseKey"
        class="state-text"
      >
        {{ currentPhrase }}
      </p>
    </div>

    <div
      v-else-if="error"
      class="state-content"
    >
      <n-alert
        title="Произошла ошибка"
        type="error"
        :bordered="false"
        class="state-alert"
      >
        <template #icon>
          <n-icon :component="WarningIcon" />
        </template>
        {{ error }}
      </n-alert>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-state-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;

  @media (prefers-color-scheme: dark) {
    background-color: rgba(0, 0, 0, 0.5);
  }
}

.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  max-width: 320px;
}

.state-text {
  font-size: 1.1rem;
  color: var(--n-text-color);
  font-weight: 500;
  margin: 0;
  min-height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;

  animation: fadeIn 0.5s ease-out forwards;
}

.state-icon {
  color: var(--primary-color, #4a90e2);
}

.state-alert {
  background-color: var(--n-color-embedded);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
