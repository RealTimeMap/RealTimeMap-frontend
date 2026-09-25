export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** Два сезона, между которыми сейчас переход, и доля второго (0..1). */
export interface SeasonBlend {
  from: Season
  to: Season
  t: number
}

/**
 * Опорные дни года (северное полушарие) и сезон, который в этот день виден целиком.
 * Между опорами — плавный переход: к концу ноября ложится снег, в апреле сходит, к июню — лето.
 */
const KEYFRAMES: [day: number, season: Season][] = [
  [0, 'winter'],
  [69, 'winter'],
  [115, 'spring'],
  [145, 'summer'],
  [237, 'summer'],
  [268, 'autumn'],
  [304, 'autumn'],
  [329, 'winter'],
  [366, 'winter'],
]

/** Ближе к экватору зим со снегом нет, а в тропиках сезоны почти не меняют цвет. */
const TROPICS_LAT = 23
const SNOW_LAT = 40

function dayOfYear(date: Date): number {
  return Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86_400_000)
}

function climateSeason(season: Season, lat: number): Season {
  const abs = Math.abs(lat)
  if (abs < TROPICS_LAT)
    return 'summer'
  if (abs < SNOW_LAT && season === 'winter')
    return 'autumn'
  return season
}

/** Сезон на дату и широту: в южном полушарии сдвинут на полгода. */
export function seasonAt(date: Date, lat: number): SeasonBlend {
  const day = (dayOfYear(date) + (lat < 0 ? 182 : 0)) % 365
  const next = KEYFRAMES.findIndex(([at]) => at > day)
  const [fromDay, from] = KEYFRAMES[next - 1]!
  const [toDay, to] = KEYFRAMES[next]!
  return { from: climateSeason(from, lat), to: climateSeason(to, lat), t: (day - fromDay) / (toDay - fromDay) }
}

/** Выбранный вручную сезон — «переход» без перехода. */
export function fixedSeason(season: Season): SeasonBlend {
  return { from: season, to: season, t: 0 }
}

/** Доля зимы в переходе сезонов — в календарном режиме это и есть «насколько лежит снег». */
export function winterShare({ from, to, t }: SeasonBlend): number {
  return (from === 'winter' ? 1 - t : 0) + (to === 'winter' ? t : 0)
}

// --- Листва и снег ---

/** Состояние лиственных деревьев и снега, всё — доли 0..1. */
export interface Foliage {
  /** Сколько деревьев уже пожелтело. */
  turned: number
  /** Сколько облетело — стоят голыми ветками, листва лежит под ними. */
  fallen: number
  /** Снежный покров: засыпает землю, листву под деревьями и крыши. */
  snow: number
}

/** Снег этой глубины (м) — карта полностью белая. */
const FULL_SNOW_M = 0.08

function ramp(day: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (day - from) / (to - from)))
}

/**
 * Листва по дням года (северное полушарие): желтеют с начала сентября до 20 октября, облетают
 * с 5 октября до середины ноября, весной распускаются с 15 апреля до середины мая.
 * snowDepth — реальный снег из прогноза, м; без него снег считается по календарю.
 */
export function foliageAt(date: Date, lat: number, snowDepth: number | null = null): Foliage {
  const snow = snowDepth === null
    ? winterShare(seasonAt(date, lat))
    : Math.min(1, Math.max(0, snowDepth / FULL_SNOW_M))
  if (Math.abs(lat) < TROPICS_LAT)
    return { turned: 0, fallen: 0, snow: 0 }
  const day = (dayOfYear(date) + (lat < 0 ? 182 : 0)) % 365
  if (day < 160) {
    const bare = 1 - ramp(day, 105, 135)
    return { turned: bare, fallen: bare, snow }
  }
  return { turned: ramp(day, 244, 293), fallen: ramp(day, 278, 318), snow }
}

/** Выбранный вручную сезон: осень — золотой парк с первыми голыми деревьями, зима — в снегу. */
export function fixedFoliage(season: Season): Foliage {
  switch (season) {
    case 'autumn': return { turned: 0.9, fallen: 0.25, snow: 0 }
    case 'winter': return { turned: 1, fallen: 1, snow: 1 }
    default: return { turned: 0, fallen: 0, snow: 0 }
  }
}
