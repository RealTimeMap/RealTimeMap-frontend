import type { Weather } from './forecast'
import { HEAVY_MM, isWetNow } from './forecast'

// --- Как погода меняет вид карты ---
// Из прогноза — несколько чисел 0..1: их читают цвета дорог, дымка, фонари и деревья.
// Считается при обновлении прогноза, в кадре — ничего

export interface WeatherLook {
  /** Туман: 1 — густой, видимость около 200 м. */
  fog: number
  /** Дождь сейчас: мокрый асфальт. */
  wet: number
  /** Снегопад сейчас: дороги присыпаны. */
  snowfall: number
  /** Лежащий снег: дороги присыпаны и без снегопада. */
  snowCover: number
  /** Тяжёлое небо: гроза, ливень. Карта темнее, горят фонари. */
  gloom: number
  /** Ветер: 1 — шторм. */
  wind: number
  /** Куда дует ветер, градусы от севера по часовой. */
  windTowards: number
}

export const CALM_LOOK: WeatherLook = { fog: 0, wet: 0, snowfall: 0, snowCover: 0, gloom: 0, wind: 0, windTowards: 0 }

/** Видимость меньше — туман; к FOG_DENSE_M он густой. */
const FOG_START_M = 2000
const FOG_DENSE_M = 200
/** Лежащий снег такой высоты, м, — дороги присыпаны почти как в снегопад. */
const SNOW_COVER_M = 0.03
const SNOW_COVER_STRENGTH = 0.7
/** Ветер слабее не заметен, к WIND_STORM_MS — шторм. */
const WIND_CALM_MS = 3
const WIND_STORM_MS = 15

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/** Осадки в ближайшие 15 минут, мм и снег ли это. */
function currentSlot(weather: Weather, now: number) {
  return weather.slots.find(slot => slot.time + 15 * 60_000 > now) ?? null
}

export function weatherLook(weather: Weather | null, now = Date.now()): WeatherLook {
  if (!weather)
    return CALM_LOOK
  const slot = currentSlot(weather, now)
  const falling = isWetNow(weather, now) && slot ? slot : null
  // Сила осадков: морось — чуть-чуть, ливень — полностью
  const intensity = falling ? clamp(0.4 + falling.mm / HEAVY_MM * 0.6) : 0
  const snowing = !!falling?.snow || (weather.sky === 'snow' && !falling)
  const raining = !snowing && (!!falling || weather.sky === 'rain' || weather.sky === 'storm')

  const byVisibility = weather.visibility === null ? 0 : clamp((FOG_START_M - weather.visibility) / (FOG_START_M - FOG_DENSE_M))
  const fog = Math.max(byVisibility, weather.sky === 'fog' ? 0.7 : 0)

  const wet = raining ? Math.max(intensity, 0.45) : 0
  const snowfall = snowing ? Math.max(intensity, 0.45) : 0

  let gloom = weather.cloudCover > 0.8 ? 0.12 : 0
  if (raining)
    gloom = Math.max(gloom, 0.25 + 0.35 * intensity)
  if (weather.sky === 'storm')
    gloom = 0.9
  gloom = Math.max(gloom, fog * 0.2)

  return {
    fog,
    wet,
    snowfall,
    snowCover: clamp(weather.snowDepth / SNOW_COVER_M) * SNOW_COVER_STRENGTH,
    gloom,
    wind: clamp((weather.windSpeed - WIND_CALM_MS) / (WIND_STORM_MS - WIND_CALM_MS)),
    windTowards: (weather.windDirection + 180) % 360,
  }
}
