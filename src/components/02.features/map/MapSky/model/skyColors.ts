import type { SkySpecification } from 'maplibre-gl'
import type { SunPosition } from '@/components/00.shared/lib/sun'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { mixHex } from '@/components/00.shared/lib/colorMix'

interface SkyPalette {
  sky: string
  horizon: string
  fog: string
}

type PaletteStop = [altitude: number, palette: SkyPalette]

/**
 * Небо по высоте солнца: ночь → сумерки → закат у горизонта → день.
 * Туман у земли подобран под фон карты темы — иначе у горизонта видна граница.
 */
const PALETTES: Record<ThemeBase, PaletteStop[]> = {
  light: [
    [-10, { sky: '#1f2a48', horizon: '#46557c', fog: '#e4e6ec' }],
    [-4, { sky: '#3d4f86', horizon: '#e0876f', fog: '#ece4e2' }],
    [3, { sky: '#6f9bd6', horizon: '#ffbf8a', fog: '#f5ece3' }],
    [15, { sky: '#88c6fc', horizon: '#d8ecfb', fog: '#f1f4f7' }],
  ],
  dark: [
    [-10, { sky: '#070b16', horizon: '#18203a', fog: '#111215' }],
    [-4, { sky: '#161d3a', horizon: '#6b3a4c', fog: '#141316' }],
    [3, { sky: '#243659', horizon: '#a8603f', fog: '#161412' }],
    [15, { sky: '#2a4a72', horizon: '#51698a', fog: '#121418' }],
  ],
}

function paletteAt(stops: PaletteStop[], altitude: number): SkyPalette {
  const next = stops.findIndex(([at]) => at > altitude)
  if (next === 0)
    return stops[0]![1]
  if (next === -1)
    return stops.at(-1)![1]
  const [from, a] = stops[next - 1]!
  const [to, b] = stops[next]!
  const t = (altitude - from) / (to - from)
  return { sky: mixHex(a.sky, b.sky, t), horizon: mixHex(a.horizon, b.horizon, t), fog: mixHex(a.fog, b.fog, t) }
}

export function skyFor(base: ThemeBase, sun: SunPosition): SkySpecification {
  const { sky, horizon, fog } = paletteAt(PALETTES[base], sun.altitude)
  return {
    'sky-color': sky,
    'horizon-color': horizon,
    'fog-color': fog,
    'sky-horizon-blend': 0.6,
    'horizon-fog-blend': 0.7,
    'fog-ground-blend': 0.85,
    'atmosphere-blend': 0,
  }
}
