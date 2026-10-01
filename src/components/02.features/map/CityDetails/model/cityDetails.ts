import type {
  ExpressionSpecification,
  FillLayerSpecification,
  LayerSpecification,
  LineLayerSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import type { ThemeBase } from '@/components/00.shared/lib/theme'

// --- Детали города ---
// Всё из тайлов CARTO, которые стиль не рисует или прячет: края парков, мощение пешеходных площадей,
// номера домов, шпалы на железной дороге

export const CARTO_SOURCE = 'carto'

const PARK_SHADE_LAYER = 'city-park-shade'
const PARK_EDGE_LAYER = 'city-park-edge'
const PAVING_LAYER = 'city-paving'
const SLEEPERS_LAYER = 'city-rail-sleepers'

/** Слои под дорогами — порядок внутри группы важен. */
export const GROUND_LAYERS = [PARK_SHADE_LAYER, PARK_EDGE_LAYER, PAVING_LAYER]
export const OWN_LAYERS = [...GROUND_LAYERS, SLEEPERS_LAYER]

export const PAVING_IMAGE = 'city-paving'
export const PIXEL_RATIO = 2

interface Palette {
  parkShade: string
  parkEdge: string
  paving: [base: string, joint: string]
  sleepers: string
  housenumber: string
  halo: string
}

export const PALETTE: Record<ThemeBase, Palette> = {
  light: {
    parkShade: 'rgba(60, 96, 52, 0.12)',
    parkEdge: 'rgba(84, 124, 74, 0.35)',
    paving: ['#f2efe8', '#e6e2d9'],
    sleepers: '#c3c7ce',
    housenumber: '#9aa0a9',
    halo: '#fafaf8',
  },
  dark: {
    parkShade: 'rgba(0, 0, 0, 0.35)',
    parkEdge: 'rgba(120, 160, 110, 0.28)',
    paving: ['#25272c', '#2b2e34'],
    sleepers: '#3c414b',
    housenumber: '#6f7682',
    halo: '#121316',
  },
}

const GREEN: ExpressionSpecification = ['match', ['get', 'class'], ['grass', 'wood'], true, false]

function parkShade(colors: Palette): LineLayerSpecification {
  // Мягкая тень от края внутрь: парк читается как участок, а не как пятно краски
  const width: ExpressionSpecification = ['interpolate', ['exponential', 2], ['zoom'], 14, 3, 18, 18, 22, 120]
  return {
    'id': PARK_SHADE_LAYER,
    'type': 'line',
    'source': CARTO_SOURCE,
    'source-layer': 'landcover',
    'minzoom': 14,
    'filter': GREEN,
    'layout': { 'line-join': 'round' },
    'paint': {
      'line-color': colors.parkShade,
      'line-width': width,
      'line-blur': width,
      'line-offset': ['interpolate', ['exponential', 2], ['zoom'], 14, 1.5, 18, 9, 22, 60],
    },
  }
}

function parkEdge(colors: Palette): LineLayerSpecification {
  return {
    'id': PARK_EDGE_LAYER,
    'type': 'line',
    'source': CARTO_SOURCE,
    'source-layer': 'landcover',
    'minzoom': 14,
    'filter': GREEN,
    'paint': {
      'line-color': colors.parkEdge,
      'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 18, 1.2],
    },
  }
}

function paving(): FillLayerSpecification {
  return {
    'id': PAVING_LAYER,
    'type': 'fill',
    'source': CARTO_SOURCE,
    'source-layer': 'transportation',
    'minzoom': 15,
    'filter': ['all', ['==', ['geometry-type'], 'Polygon'], ['match', ['get', 'subclass'], ['pedestrian', 'platform'], true, false]],
    'paint': {
      'fill-pattern': PAVING_IMAGE,
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 1],
    },
  }
}

/** Шпалы: короткие поперечные штрихи под рельсами. */
function sleepers(colors: Palette): LineLayerSpecification {
  return {
    'id': SLEEPERS_LAYER,
    'type': 'line',
    'source': CARTO_SOURCE,
    'source-layer': 'transportation',
    'minzoom': 16,
    'filter': ['all', ['==', ['get', 'class'], 'rail'], ['!=', ['get', 'brunnel'], 'tunnel']],
    'layout': { 'line-cap': 'butt' },
    'paint': {
      'line-color': colors.sleepers,
      'line-width': ['interpolate', ['exponential', 2], ['zoom'], 16, 4, 18, 8, 20, 20, 22, 60],
      'line-dasharray': [0.18, 0.55],
    },
  }
}

export function groundLayers(base: ThemeBase): LayerSpecification[] {
  const colors = PALETTE[base]
  return [parkShade(colors), parkEdge(colors), paving()]
}

export const sleepersLayer = (base: ThemeBase) => sleepers(PALETTE[base])

export function paintColors(base: ThemeBase): Array<[id: string, property: 'line-color', value: string]> {
  const colors = PALETTE[base]
  return [
    [PARK_SHADE_LAYER, 'line-color', colors.parkShade],
    [PARK_EDGE_LAYER, 'line-color', colors.parkEdge],
    [SLEEPERS_LAYER, 'line-color', colors.sleepers],
  ]
}

/** Зелень и площади — сразу над слоем зелени стиля, под дорогами. */
export function groundBeforeId(layers: LayerSpecification[]): string | undefined {
  const index = layers.findIndex(layer => /^(?:tunnel|road|bridge)_/.test(layer.id))
  return index === -1 ? undefined : layers[index]!.id
}

/** Шпалы — под рельсами стиля. */
export function sleepersBeforeId(layers: LayerSpecification[]): string | undefined {
  return layers.find(layer => layer.id === 'rail')?.id
}

/** Номера домов в стиле есть, но прозрачные — проявляем до загрузки стиля. */
export function styleCity(style: StyleSpecification, base: ThemeBase): StyleSpecification {
  const colors = PALETTE[base]
  const layers = style.layers.map((layer) => {
    if (layer.id !== 'housenumber' || layer.type !== 'symbol')
      return layer
    return {
      ...layer,
      paint: { ...layer.paint, 'text-color': colors.housenumber, 'text-halo-color': colors.halo, 'text-halo-width': 1 },
    }
  })
  return { ...style, layers }
}

// --- Картинки ---

function canvas(width: number, height: number) {
  const element = document.createElement('canvas')
  element.width = width * PIXEL_RATIO
  element.height = height * PIXEL_RATIO
  const ctx = element.getContext('2d')!
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO)
  return { ctx, image: () => ctx.getImageData(0, 0, element.width, element.height) }
}

/** Плитка мощения: кладка вразбежку, швы чуть темнее камня. */
export function drawPaving(base: ThemeBase): ImageData {
  const [stone, joint] = PALETTE[base].paving
  const size = 16
  const { ctx, image } = canvas(size, size)
  ctx.fillStyle = stone
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = joint
  ctx.lineWidth = 0.75
  ctx.beginPath()
  for (const y of [0, 8]) {
    ctx.moveTo(0, y + 0.4)
    ctx.lineTo(size, y + 0.4)
  }
  ctx.moveTo(0.4, 0)
  ctx.lineTo(0.4, 8)
  ctx.moveTo(8.4, 8)
  ctx.lineTo(8.4, 16)
  ctx.stroke()
  return image()
}
