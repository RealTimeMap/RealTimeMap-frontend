/**
 * Время, по которому живёт карта: солнце, тени, небо, луна, вода и сезоны.
 * В разработке его можно подменить параметром адреса — чтобы посмотреть ночь или закат днём:
 * ?map-time=23:00, ?map-time=night | sunset | day, ?map-time=2026-12-31T22:00 (сезон тоже сменится),
 * ?map-time=off — вернуть настоящее время. В сборке для пользователей всегда настоящее время.
 */
const STORAGE_KEY = 'rtm_map_time'
const PRESETS: Record<string, string> = { night: '23:30', sunset: '18:30', day: '13:00', morning: '07:30' }

function readOverride(): string | null {
  if (!import.meta.env.DEV)
    return null
  try {
    const param = new URLSearchParams(location.search).get('map-time')
    if (param === 'off')
      sessionStorage.removeItem(STORAGE_KEY)
    else if (param)
      sessionStorage.setItem(STORAGE_KEY, PRESETS[param] ?? param)
    return sessionStorage.getItem(STORAGE_KEY)
  }
  catch {
    return null
  }
}

const override = readOverride()

/** Сдвиг от настоящего времени: часы идут дальше, как обычно, просто с другой точки. */
const offsetMs = (() => {
  if (!override)
    return 0
  const now = new Date()
  const time = override.match(/^(\d{1,2}):(\d{2})$/)
  if (time) {
    const target = new Date(now)
    target.setHours(Number(time[1]), Number(time[2]), 0, 0)
    return target.getTime() - now.getTime()
  }
  const date = new Date(override)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime() - now.getTime()
})()

if (offsetMs)
  console.warn(`[map-time] Карта живёт по подменённому времени: ${new Date(Date.now() + offsetMs).toLocaleString('ru-RU')}. Вернуть: ?map-time=off`)

export function mapNow(): Date {
  return new Date(Date.now() + offsetMs)
}
