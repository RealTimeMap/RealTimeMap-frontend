<script setup lang="ts">
import type { Sky } from '../model/forecast'
import { storeToRefs } from 'pinia'
import { describe, HEAVY_MM, WET_MM } from '../model/forecast'
import { useWeatherStore } from '../model/store'

const store = useWeatherStore()
const { weather } = storeToRefs(store)
const expanded = ref(false)

// Имена иконок целиком — сборщик иконок кладёт в бандл только те, что встречаются в коде
const ICONS: Record<Sky, string> = {
  clear: 'app:weather-sun',
  partly: 'app:weather-partly',
  cloudy: 'app:weather-cloud',
  fog: 'app:weather-fog',
  rain: 'app:weather-rain',
  snow: 'app:weather-snow',
  storm: 'app:weather-storm',
}

/** Минутный тик — чтобы «через 20 мин» не застывало между обновлениями прогноза. */
const now = ref(Date.now())
const clock = setInterval(() => {
  now.value = Date.now()
}, 60_000)

const summary = computed(() => weather.value ? describe(weather.value, now.value) : null)

const icon = computed(() => {
  const current = weather.value
  if (!current)
    return ICONS.cloudy
  // Осадки скоро — показываем их, а не нынешнее ясное небо
  if (summary.value?.alert)
    return current.slots.some(slot => slot.snow) ? ICONS.snow : ICONS.rain
  if (current.sky === 'clear' && !current.isDay)
    return 'app:weather-moon'
  return ICONS[current.sky]
})

/** Столбики на 3 часа: высота — сила осадков. */
const bars = computed(() => (weather.value?.slots ?? []).map(slot => ({
  time: slot.time,
  height: slot.mm < WET_MM ? 0 : Math.min(1, 0.25 + slot.mm / HEAVY_MM * 0.75),
  snow: slot.snow,
})))

const hasPrecipitation = computed(() => bars.value.some(bar => bar.height > 0))

function clockLabel(time: number): string {
  return new Date(time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

onUnmounted(() => clearInterval(clock))
</script>

<template>
  <transition name="weather">
    <div
      v-if="weather && summary"
      class="weather"
      :class="{ 'weather--alert': summary.alert, 'weather--expanded': expanded }"
    >
      <button
        class="weather__chip"
        type="button"
        :aria-expanded="expanded"
        :aria-label="`Погода: ${weather.temperature}°, ${summary.label}`"
        @click="expanded = !expanded"
      >
        <u-icon
          class="weather__icon"
          :icon="icon"
          width="18"
        />
        <span class="weather__temp">{{ weather.temperature }}°</span>
        <span class="weather__label">{{ summary.label }}</span>
      </button>

      <transition name="weather-panel">
        <div
          v-if="expanded"
          class="weather__panel"
        >
          <span class="weather__panel-title">Осадки на 3 часа</span>
          <div
            v-if="hasPrecipitation"
            class="weather__bars"
          >
            <span
              v-for="bar in bars"
              :key="bar.time"
              class="weather__bar"
              :class="{ 'weather__bar--snow': bar.snow }"
              :style="{ '--h': bar.height }"
            />
          </div>
          <span
            v-else
            class="weather__dry"
          >Без осадков</span>
          <div class="weather__axis">
            <span>сейчас</span>
            <span v-if="bars.length">{{ clockLabel(bars[bars.length - 1]!.time) }}</span>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.weather {
  position: fixed;
  top: calc(80px + var(--safe-top));
  left: 5%;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  max-width: calc(90% - 60px);

  &__chip {
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 6px 12px 6px 10px;
    border: 0.5px solid var(--glass-border);
    border-radius: 999px;
    background: var(--bg-block-solid, var(--bg-color-block));
    box-shadow: var(--glass-shadow) 0 8px 24px;
    cursor: pointer;
  }

  &__icon {
    flex: 0 0 auto;
    color: var(--text-color-secondary);
  }

  &--alert &__icon {
    color: var(--primary-color);
  }

  &__temp {
    @include value-text(14px, var(--text-color), 800);
    font-variant-numeric: tabular-nums;
  }

  &__label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    @include label-text(12px, none);
  }

  &--alert &__label {
    @include value-text(12px, var(--text-color), 600);
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 220px;
    padding: 12px;
    border: 0.5px solid var(--glass-border);
    border-radius: 16px;
    background: var(--bg-block-solid, var(--bg-color-block));
    box-shadow: var(--glass-shadow) 0 8px 24px;
  }

  &__panel-title {
    @include label-text(11px, uppercase);
    letter-spacing: 0.5px;
  }

  &__bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 40px;
  }

  &__bar {
    flex: 1;
    height: calc(var(--h) * 100%);
    min-height: 2px;
    border-radius: 3px 3px 1px 1px;
    background: var(--primary-color);
    opacity: calc(0.35 + var(--h) * 0.65);

    &--snow {
      background: color-mix(in srgb, var(--primary-color) 40%, #ffffff);
    }
  }

  &__dry {
    @include value-text(13px, var(--text-color), 600);
  }

  &__axis {
    display: flex;
    justify-content: space-between;
    @include label-text(10px, none);
    font-variant-numeric: tabular-nums;
  }
}

.weather-enter-active,
.weather-leave-active,
.weather-panel-enter-active,
.weather-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.weather-enter-from,
.weather-leave-to,
.weather-panel-enter-from,
.weather-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
