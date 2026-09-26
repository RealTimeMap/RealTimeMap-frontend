import type { Sky, Weather } from './forecast'

/**
 * Подмена погоды для разработки — посмотреть карту в тумане или под дождём, не дожидаясь их:
 * ?map-weather=fog | rain | snow | storm | wind | clear, ?map-weather=off — вернуть настоящую.
 * В сборке для пользователей всегда настоящая погода.
 */
const STORAGE_KEY = 'rtm_map_weather'
const KINDS = ['fog', 'rain', 'snow', 'storm', 'wind', 'clear'] as const
type Kind = typeof KINDS[number]

function readOverride(): Kind | null {
  if (!import.meta.env.DEV)
    return null
  try {
    const param = new URLSearchParams(location.search).get('map-weather')
    if (param === 'off')
      sessionStorage.removeItem(STORAGE_KEY)
    else if (param && (KINDS as readonly string[]).includes(param))
      sessionStorage.setItem(STORAGE_KEY, param)
    return sessionStorage.getItem(STORAGE_KEY) as Kind | null
  }
  catch {
    return null
  }
}

const override = readOverride()

if (override)
  console.warn(`[map-weather] Погода подменена: ${override}. Вернуть: ?map-weather=off`)

const SKY: Record<Kind, Sky> = { fog: 'fog', rain: 'rain', snow: 'snow', storm: 'storm', wind: 'partly', clear: 'clear' }

export function applyWeatherOverride(weather: Weather): Weather {
  if (!override)
    return weather
  const wet = override === 'rain' || override === 'snow' || override === 'storm'
  const mm = override === 'storm' ? 2.5 : 0.8
  return {
    ...weather,
    sky: SKY[override],
    cloudCover: override === 'clear' ? 0.05 : override === 'wind' ? 0.4 : 1,
    visibility: override === 'fog' ? 250 : 20_000,
    windSpeed: override === 'wind' ? 13 : override === 'storm' ? 11 : 2,
    slots: weather.slots.map(slot => ({ ...slot, mm: wet ? mm : 0, snow: override === 'snow' })),
  }
}
