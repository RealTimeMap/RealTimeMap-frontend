import type { ExpressionSpecification, LineLayerSpecification } from 'maplibre-gl'
import type { ThemeBase } from '@/components/00.shared/lib/theme'

export const LIGHTS_LAYER_ID = 'night-street-lights'
const CARTO_SOURCE = 'carto'

const LIGHTS: Record<ThemeBase, { color: string, opacity: number }> = {
  light: { color: '#ffc46b', opacity: 0.55 },
  dark: { color: '#ffb34d', opacity: 0.45 },
}

/** Насколько темно: 0 — день, 1 — полная ночь. Сумерки — плавный переход; с -6° карта уже в ночном стиле. */
export function darknessAt(sunAltitude: number): number {
  return Math.min(1, Math.max(0, (-1 - sunAltitude) / 9))
}

export function lightsOpacity(base: ThemeBase, darkness: number): number {
  return Math.round(LIGHTS[base].opacity * darkness * 100) / 100
}

/** Ширина свечения растёт с зумом, чтобы вблизи фонари не превращались в нитку. */
const LIGHTS_WIDTH: ExpressionSpecification = ['interpolate', ['exponential', 1.6], ['zoom'], 10, 2, 14, 7, 18, 34]
/** Размытие почти во всю ширину — свет, а не нарисованная линия. zoom допустим только на верхнем уровне выражения. */
const LIGHTS_BLUR: ExpressionSpecification = ['interpolate', ['exponential', 1.6], ['zoom'], 10, 1.6, 14, 5.6, 18, 27]

export function createLightsLayer(base: ThemeBase, darkness: number): LineLayerSpecification {
  return {
    'id': LIGHTS_LAYER_ID,
    'type': 'line',
    'source': CARTO_SOURCE,
    'source-layer': 'transportation',
    'minzoom': 10,
    // Фонари — только на крупных улицах: иначе весь город светился бы сплошной сеткой
    'filter': ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary'], true, false],
    'layout': { 'visibility': darkness > 0 ? 'visible' : 'none', 'line-join': 'round', 'line-cap': 'round' },
    'paint': {
      'line-color': LIGHTS[base].color,
      'line-width': LIGHTS_WIDTH,
      'line-blur': LIGHTS_BLUR,
      'line-opacity': lightsOpacity(base, darkness),
      'line-opacity-transition': { duration: 1500, delay: 0 },
    },
  }
}
