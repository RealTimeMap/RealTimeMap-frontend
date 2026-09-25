import type { Season, SeasonBlend } from '@/components/00.shared/lib/season'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { mixHex } from '@/components/00.shared/lib/colorMix'

export interface SeasonPalette {
  /** Земля без покрытия. */
  ground: string
  /** Газоны, парки, кладбища, стадионы. */
  green: string
  /** Леса и деревья — осенью желтеют сильнее травы, зимой в снегу чуть темнее полян. */
  wood: string
  water: string
  waterway: string
}

type PaletteKey = keyof SeasonPalette

/**
 * Палитры сезонов. Светлая — поверх Positron, тёмная — поверх Dark Matter,
 * где парки в исходном стиле сливаются с фоном: сезон там читается по едва заметным оттенкам.
 */
const PALETTES: Record<ThemeBase, Record<Season, SeasonPalette>> = {
  light: {
    spring: { ground: '#fafaf6', green: '#e1f1d4', wood: '#d8ecc9', water: '#d0dee4', waterway: '#c9d9e0' },
    summer: { ground: '#fafaf8', green: '#d9ead0', wood: '#cfe4c3', water: '#cddbe2', waterway: '#c6d6de' },
    // Осень — не бежевая заливка: деревья золотые, трава выцветает до жёлто-зелёной, фон остаётся нейтральным
    autumn: { ground: '#fafaf7', green: '#e7ebcf', wood: '#f2e2ae', water: '#d0dade', waterway: '#c9d5da' },
    winter: { ground: '#f5f8fa', green: '#e9eff4', wood: '#e0e8ee', water: '#e1eaf0', waterway: '#d9e4eb' },
  },
  dark: {
    spring: { ground: '#0e0e0d', green: '#121b10', wood: '#101a0e', water: '#28343c', waterway: '#3a5669' },
    summer: { ground: '#0e0e0e', green: '#0f1812', wood: '#0d1710', water: '#26323a', waterway: '#3a5669' },
    autumn: { ground: '#0f0f0e', green: '#161a10', wood: '#241a0b', water: '#2a3136', waterway: '#3d5160' },
    winter: { ground: '#121417', green: '#1b1f25', wood: '#181c22', water: '#2e3a43', waterway: '#4a5d6b' },
  },
}

function mixPalettes(a: SeasonPalette, b: SeasonPalette, t: number): SeasonPalette {
  const keys = Object.keys(a) as PaletteKey[]
  return Object.fromEntries(keys.map(key => [key, mixHex(a[key], b[key], t)])) as unknown as SeasonPalette
}

/** Зима без снега: пожухлая трава, голые серо-бурые леса, холодная тёмная вода. */
const BARE: Record<ThemeBase, SeasonPalette> = {
  light: { ground: '#f7f6f3', green: '#e6e6da', wood: '#dcd8cc', water: '#cad4d9', waterway: '#c3cdd2' },
  dark: { ground: '#0f0f0f', green: '#151612', wood: '#191713', water: '#262f35', waterway: '#374a57' },
}

export function paletteFor(base: ThemeBase, { from, to, t }: SeasonBlend): SeasonPalette {
  return mixPalettes(PALETTES[base][from], PALETTES[base][to], t)
}

/**
 * Палитра с настоящим снегом: календарная зима заменяется бесснежной, а белизна — по снежному покрову.
 * Снег выпал в октябре — карта белеет; в январе оттепель и снег сошёл — земля снова серая.
 */
export function paletteWithSnow(base: ThemeBase, { from, to, t }: SeasonBlend, snow: number): SeasonPalette {
  const season = (value: Season) => value === 'winter' ? BARE[base] : PALETTES[base][value]
  return mixPalettes(mixPalettes(season(from), season(to), t), PALETTES[base].winter, snow)
}

/** Какие слои стиля CARTO и каким свойством перекрашиваются. */
export type SeasonProperty = 'background-color' | 'fill-color' | 'line-color'

export interface SeasonTarget {
  layer: string
  property: SeasonProperty
  key: PaletteKey
}

export const SEASON_TARGETS: SeasonTarget[] = [
  { layer: 'background', property: 'background-color', key: 'ground' },
  { layer: 'landcover', property: 'fill-color', key: 'wood' },
  { layer: 'park_national_park', property: 'fill-color', key: 'green' },
  { layer: 'park_nature_reserve', property: 'fill-color', key: 'green' },
  { layer: 'landuse', property: 'fill-color', key: 'green' },
  { layer: 'water', property: 'fill-color', key: 'water' },
  { layer: 'waterway', property: 'line-color', key: 'waterway' },
]

/**
 * Значение цвета для слоя. В landcover лежат и леса, и газоны — различаем по классу.
 * Выражение по данным перезагружает тайлы слоя, но меняется оно только при смене сезона.
 */
export function seasonValue(target: SeasonTarget, palette: SeasonPalette): unknown {
  if (target.layer === 'landcover')
    return ['match', ['get', 'class'], 'wood', palette.wood, palette.green]
  return palette[target.key]
}
