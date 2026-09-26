import type { ThemeBase } from '@/components/00.shared/lib/theme'

// --- Дороги под погоду ---
// Мокрый асфальт темнеет и отливает синим, снег присыпает дороги. Цвет стиля не заменяем,
// а смешиваем с погодным — ступени по зуму и различия между типами дорог сохраняются

/** Слои дорог в стилях CARTO: road_*, bridge_*, tunnel_* — заливка, обводка, дорожки. */
const ROAD_LAYER = /^(?:road|bridge|tunnel)_.*(?:fill|case|path)/

export type RoadPart = 'fill' | 'case' | 'path'

export function roadPart(layerId: string): RoadPart | null {
  if (!ROAD_LAYER.test(layerId))
    return null
  if (layerId.includes('case'))
    return 'case'
  return layerId.includes('path') ? 'path' : 'fill'
}

type Tint = Record<RoadPart, [color: string, strength: number]>

/** Мокрый асфальт: на светлой карте — серо-голубой, на тёмной — синеватый отблеск. */
const WET: Record<ThemeBase, Tint> = {
  light: { fill: ['#b3bfcc', 0.75], case: ['#95a3b3', 0.65], path: ['#a9b5c2', 0.5] },
  dark: { fill: ['#34445c', 0.7], case: ['#222b38', 0.5], path: ['#34445c', 0.5] },
}

/** Снег: на светлой карте белеют обводки, на тёмной дороги становятся серо-снежными. */
const SNOW: Record<ThemeBase, Tint> = {
  light: { fill: ['#ffffff', 0.5], case: ['#eef2f6', 0.7], path: ['#f0f3f6', 0.6] },
  dark: { fill: ['#6b7480', 0.5], case: ['#4a525d', 0.4], path: ['#6b7480', 0.45] },
}

type Rgba = [number, number, number, number]

function parseColor(value: string): Rgba | null {
  const text = value.trim().toLowerCase()
  if (text === 'transparent')
    return [0, 0, 0, 0]
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (hex) {
    const digits = hex[1]!.length === 3 ? [...hex[1]!].map(d => d + d).join('') : hex[1]!
    return [0, 2, 4].map(i => Number.parseInt(digits.slice(i, i + 2), 16)).concat(1) as Rgba
  }
  const rgb = text.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const parts = rgb[1]!.split(',').map(part => Number.parseFloat(part))
    if (parts.length >= 3 && parts.every(Number.isFinite))
      return [parts[0]!, parts[1]!, parts[2]!, parts[3] ?? 1]
  }
  return null
}

function mix(base: string, target: string, amount: number): string {
  const from = parseColor(base)
  const to = parseColor(target)
  if (!from || !to || from[3] === 0)
    return base
  const [r, g, b] = from.slice(0, 3).map((channel, i) => Math.round(channel + (to[i]! - channel) * amount))
  return `rgba(${r}, ${g}, ${b}, ${from[3]})`
}

/** Заменяет цвета внутри значения стиля: строка, {stops: [[zoom, цвет]]} или выражение. */
function mapColors(value: unknown, change: (color: string) => string): unknown {
  if (typeof value === 'string')
    return parseColor(value) ? change(value) : value
  if (Array.isArray(value))
    return value.map(item => mapColors(item, change))
  if (value && typeof value === 'object') {
    const stops = (value as { stops?: unknown }).stops
    if (Array.isArray(stops))
      return { ...value, stops: stops.map(stop => Array.isArray(stop) ? [stop[0], mapColors(stop[1], change)] : stop) }
  }
  return value
}

/** Цвет дороги под погоду. wet и snow — 0..1; при нуле возвращается исходный цвет стиля. */
export function weatherRoadColor(original: unknown, part: RoadPart, base: ThemeBase, wet: number, snow: number): unknown {
  if (wet <= 0 && snow <= 0)
    return original
  return mapColors(original, (color) => {
    let result = color
    if (wet > 0)
      result = mix(result, WET[base][part][0], WET[base][part][1] * wet)
    if (snow > 0)
      result = mix(result, SNOW[base][part][0], SNOW[base][part][1] * snow)
    return result
  })
}
