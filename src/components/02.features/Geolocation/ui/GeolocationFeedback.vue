<script setup lang="ts">
type GeoErrorReason = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'generic'

interface Props {
  isLoading: boolean
  error: string | null
  errorReason?: GeoErrorReason | null
}
const props = defineProps<Props>()

const emit = defineEmits<{
  retry: []
}>()

const isNative = computed(() => {
  const cap = (window as any).Capacitor
  return !!(cap && cap.isNativePlatform())
})

const errorView = computed(() => {
  const reason = props.errorReason ?? 'generic'

  const enableHint = isNative.value
    ? 'Откройте настройки телефона и включите геолокацию (Службы геолокации), затем разрешите доступ приложению и нажмите «Повторная попытка».'
    : 'Разрешите доступ к геолокации в настройках браузера для этого сайта и нажмите «Повторная попытка».'

  switch (reason) {
    case 'denied':
      return {
        icon: 'solar:map-point-remove-bold-duotone',
        title: 'Нет доступа к геолокации',
        description: `Приложению нужен доступ к вашему местоположению, чтобы показать карту. ${enableHint}`,
      }
    case 'unavailable':
      return {
        icon: 'solar:gps-bold-duotone',
        title: 'Геолокация выключена',
        description: `Не удалось определить местоположение. Проверьте, что геолокация включена. ${enableHint}`,
      }
    case 'timeout':
      return {
        icon: 'solar:gps-bold-duotone',
        title: 'Не удалось найти вас',
        description: 'Определение местоположения заняло слишком много времени. Проверьте сигнал GPS и попробуйте ещё раз.',
      }
    case 'unsupported':
      return {
        icon: 'line-md:alert-loop',
        title: 'Геолокация недоступна',
        description: props.error ?? 'Ваше устройство не поддерживает геолокацию.',
      }
    default:
      return {
        icon: 'line-md:alert-loop',
        title: 'Произошла ошибка',
        description: props.error ?? 'Не удалось получить местоположение.',
      }
  }
})

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
    class="map-state-indicator"
  >
    <div
      v-if="isLoading"
      class="state-content"
    >
      <u-icon
        icon="line-md:loading-twotone-loop"
        height="30"
        width="30"
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
      class="state-content state-content--error"
    >
      <div class="error-alert">
        <div class="error-alert__header">
          <u-icon
            :icon="errorView.icon"
            height="28"
            width="28"
            class="error-alert__icon"
          />
          <h3 class="error-alert__title">
            {{ errorView.title }}
          </h3>
        </div>
        <p class="error-alert__description">
          {{ errorView.description }}
        </p>
        <button
          type="button"
          class="error-alert__retry"
          @click="emit('retry')"
        >
          <u-icon
            icon="solar:refresh-linear"
            width="16"
            height="16"
          />
          Повторная попытка
        </button>
      </div>
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
  background-color: var(--bg-color-soft);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 1000;
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

.error-alert {
  background: var(--bg-color-block);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-md);
  padding: 20px;
  width: 100%;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 10px 30px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__icon {
    color: var(--red-color);
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
  }

  &__description {
    font-size: 0.95rem;
    color: var(--text-color);
    opacity: 0.8;
    margin: 0;
    line-height: 1.4;
  }

  &__retry {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    padding: 9px 18px;
    border-radius: 999px;
    border: 0.5px solid var(--border-subtle);
    background: var(--surface-subtle);
    color: var(--text-color);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:active {
      transform: scale(0.96);
    }
  }
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
