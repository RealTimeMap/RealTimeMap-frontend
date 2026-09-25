import type { MapPoint } from '@/types/shared/map'

const API = 'https://api.open-meteo.com/v1/forecast'
/** 12 шагов по 15 минут — прогноз осадков на 3 часа вперёд. */
const SLOTS = 12
/** Меньше за 15 минут — морось, которую не стоит объявлять. */
const WET_MM = 0.1
const HEAVY_MM = 1.5

export type Sky = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

export interface Slot {
  /** Начало 15-минутного отрезка, мс. */
  time: number
  /** Осадки за отрезок, мм. */
  mm: number
  snow: boolean
}

export interface Weather {
  temperature: number
  sky: Sky
  isDay: boolean
  /** Облачность, 0..1 — для неба и теней карты. */
  cloudCover: number
  /** Высота снежного покрова, м. */
  snowDepth: number
  slots: Slot[]
  fetchedAt: number
}

interface Response {
  current: { temperature_2m: number, weather_code: number, cloud_cover: number, is_day: number, snow_depth?: number }
  minutely_15: { time: number[], precipitation: number[], snowfall: number[] }
}

/** Код погоды WMO → понятная категория. */
function skyFromCode(code: number): Sky {
  if (code <= 1)
    return 'clear'
  if (code === 2)
    return 'partly'
  if (code === 3)
    return 'cloudy'
  if (code === 45 || code === 48)
    return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return 'snow'
  if (code >= 95)
    return 'storm'
  return 'rain'
}

export async function fetchWeather([lng, lat]: MapPoint, signal?: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lng.toFixed(3),
    current: 'temperature_2m,weather_code,cloud_cover,is_day,snow_depth',
    minutely_15: 'precipitation,snowfall',
    forecast_minutely_15: String(SLOTS),
    timeformat: 'unixtime',
    timezone: 'GMT',
  })
  const response = await fetch(`${API}?${params}`, { signal })
  if (!response.ok)
    throw new Error(`Open-Meteo: ${response.status}`)
  const { current, minutely_15: minutely } = await response.json() as Response
  return {
    temperature: Math.round(current.temperature_2m),
    sky: skyFromCode(current.weather_code),
    isDay: current.is_day === 1,
    cloudCover: current.cloud_cover / 100,
    snowDepth: current.snow_depth ?? 0,
    slots: minutely.time.map((time, i) => ({
      time: time * 1000,
      mm: minutely.precipitation[i] ?? 0,
      snow: (minutely.snowfall[i] ?? 0) > 0,
    })),
    fetchedAt: Date.now(),
  }
}

const SKY_LABEL: Record<Sky, string> = {
  clear: 'Ясно',
  partly: 'Переменная облачность',
  cloudy: 'Пасмурно',
  fog: 'Туман',
  rain: 'Дождь',
  snow: 'Снег',
  storm: 'Гроза',
}

function minutesUntil(time: number, now: number): number {
  return Math.max(0, Math.round((time - now) / 60_000 / 5) * 5)
}

function duration(minutes: number): string {
  if (minutes < 60)
    return `${minutes} мин`
  const hours = Math.round(minutes / 30) / 2
  return `${String(hours).replace('.', ',')} ч`
}

/**
 * Главное о погоде одной строкой. Осадки важнее облаков: «Дождь через 20 мин» или «Дождь ещё 40 мин».
 * Без осадков в ближайшие 3 часа — просто состояние неба.
 */
export function describe(weather: Weather, now = Date.now()): { label: string, alert: boolean } {
  const wet = weather.slots.map(slot => slot.mm >= WET_MM)
  const current = weather.slots.findIndex(slot => slot.time + 15 * 60_000 > now)
  if (current === -1)
    return { label: SKY_LABEL[weather.sky], alert: false }

  const heavy = weather.slots.some(slot => slot.mm >= HEAVY_MM)
  const firstWet = wet.findIndex((value, i) => value && i >= current)
  if (firstWet === -1)
    return { label: SKY_LABEL[weather.sky], alert: false }

  const kind = weather.slots[firstWet]!.snow ? 'Снег' : heavy ? 'Ливень' : 'Дождь'
  const lastWet = wet.findIndex((value, i) => !value && i > firstWet)
  const endsAt = lastWet === -1 ? null : weather.slots[lastWet]!.time

  if (firstWet === current) {
    return {
      label: endsAt ? `${kind} ещё ${duration(minutesUntil(endsAt, now))}` : `${kind} надолго`,
      alert: true,
    }
  }
  const startsIn = minutesUntil(weather.slots[firstWet]!.time, now)
  return {
    label: startsIn <= 5 ? `${kind} вот-вот начнётся` : `${kind} через ${duration(startsIn)}`,
    alert: true,
  }
}

/** Осадки идут прямо сейчас. */
export function isWetNow(weather: Weather | null, now = Date.now()): boolean {
  const slot = weather?.slots.find(item => item.time + 15 * 60_000 > now)
  return !!slot && slot.mm >= WET_MM
}

/** Сколько солнца доходит до земли: 1 — ясно, 0.15 — плотные облака, почти 0 — дождь. Без прогноза — ясно. */
export function sunStrength(weather: Weather | null): number {
  if (!weather)
    return 1
  if (isWetNow(weather) || weather.sky === 'fog')
    return 0.05
  return 1 - weather.cloudCover * 0.85
}

/** Насколько небо затянуто для цвета неба: 0 — ясно, 1 — серое. */
export function overcast(weather: Weather | null): number {
  if (!weather)
    return 0
  return isWetNow(weather) || weather.sky === 'fog' ? 1 : Math.max(0, (weather.cloudCover - 0.3) / 0.7)
}

export { HEAVY_MM, WET_MM }
