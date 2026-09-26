import type { Weather } from './forecast'
import type { MapPoint } from '@/types/shared/map'
import { distanceMeters } from '@/components/00.shared/lib/geo'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { applyWeatherOverride } from './devOverride'
import { fetchWeather } from './forecast'
import { CALM_LOOK, weatherLook } from './look'

/** Прогноз с шагом 15 минут — чаще спрашивать незачем. */
const STALE_MS = 15 * 60_000
/** Уехали дальше — погода другая, спрашиваем заново. */
const MOVED_M = 3000

/** Погода у пользователя. Одна на приложение: её читают плашка на карте, небо и вода. */
export const useWeatherStore = defineStore('weather', () => {
  const weather = shallowRef<Weather | null>(null)
  let lastPoint: MapPoint | null = null
  let abort: AbortController | null = null

  async function refresh(point: MapPoint | null, force = false) {
    if (!point)
      return
    const fresh = weather.value && Date.now() - weather.value.fetchedAt < STALE_MS
    const near = lastPoint && distanceMeters(lastPoint, point) < MOVED_M
    if (!force && fresh && near)
      return
    abort?.abort()
    abort = new AbortController()
    try {
      weather.value = applyWeatherOverride(await fetchWeather(point, abort.signal))
      lastPoint = point
    }
    catch {
      // Без сети остаётся прошлый прогноз, если он был
    }
  }

  /** Высота снега из прогноза, м; null — прогноза нет, снег считается по календарю. */
  const snowDepth = computed(() => weather.value?.snowDepth ?? null)

  const settings = useSettingsStore()
  /**
   * Как погода меняет вид карты: туман, мокрый асфальт, снег, тяжёлое небо, ветер.
   * Выключили погоду на карте — все, кто это читает, получают спокойную погоду и возвращают обычный вид.
   */
  const look = computed(() => settings.showWeather && settings.showWeatherEffects ? weatherLook(weather.value) : CALM_LOOK)

  return { weather, snowDepth, look, refresh }
})
