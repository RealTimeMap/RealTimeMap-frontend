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
