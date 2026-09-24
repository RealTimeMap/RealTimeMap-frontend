import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  LayerSpecification,
  LightSpecification,
} from 'maplibre-gl'
import type { ThemeBase } from '@/components/00.shared/lib/theme'

export const BUILDINGS_LAYER_ID = '3d-buildings'

/** Векторный источник и слой зданий в стилях CARTO (carto.streets). */
export const SOURCE_ID = 'carto'
export const SOURCE_LAYER = 'building'

/** Здания появляются только на городских зумах и дорастают до полной высоты к FULL_ZOOM. */
const MIN_ZOOM = 13
const FULL_ZOOM = 15.5

// Высота/база берутся из атрибутов тайла, если они есть, иначе — типовое значение.
const RAW_HEIGHT: ExpressionSpecification = [
  'case',
  ['has', 'render_height'],
  ['get', 'render_height'],
  ['has', 'height'],
  ['get', 'height'],
  12,
]

const RAW_BASE: ExpressionSpecification = [
  'case',
  ['has', 'render_min_height'],
  ['get', 'render_min_height'],
  ['has', 'min_height'],
  ['get', 'min_height'],
  0,
]

/**
 * Доля высоты для анимации появления. Живёт в feature-state, а не в выражении:
 * смена data-driven выражения через setPaintProperty перезагружает тайлы всего источника,
 * а feature-state обновляет значения прямо в буферах. Без состояния — полная высота.
 */
const RISE: ExpressionSpecification = ['coalesce', ['feature-state', 'rise'], 1]

/** Zoom-выражение допустимо только на верхнем уровне, поэтому rise умножается внутри interpolate. */
function byZoom(value: ExpressionSpecification): ExpressionSpecification {
  return ['interpolate', ['linear'], ['zoom'], MIN_ZOOM, 0, FULL_ZOOM, ['*', value, RISE]]
}

/** База растёт вместе с высотой — иначе посреди анимации она оказалась бы выше крыши. */
const HEIGHT = byZoom(RAW_HEIGHT)
const BASE = byZoom(RAW_BASE)

/** Цвет по высоте: объём читается без прозрачности. */
const COLORS: Record<ThemeBase, [low: string, high: string]> = {
  dark: ['#2b2f36', '#3b414b'],
  light: ['#ecebe7', '#dddbd5'],
}

/**
 * Мягкий свет: при стандартной интенсивности 0.5 теневые стороны почти чёрные.
 * Свет почти сверху и слабый — грани отличаются, но без резкого контраста.
 */
export const SOFT_LIGHT: LightSpecification = {
  anchor: 'viewport',
  color: '#ffffff',
  intensity: 0.22,
  position: [1.15, 200, 25],
}

/** Значения MapLibre по умолчанию — возвращаем их, когда здания выключают. */
export const DEFAULT_LIGHT: LightSpecification = {
  anchor: 'viewport',
  color: '#ffffff',
  intensity: 0.5,
  position: [1.15, 210, 30],
}

const OWN_LAYER_TYPES = new Set(['symbol', 'custom', 'heatmap'])

/**
 * Куда вставить здания: сразу после последнего слоя с геометрией стиля (дороги, мосты, заливки),
 * чтобы дороги не рисовались поверх крыш, но подписи остались выше.
 * В Positron часть подписей идёт раньше дорог, поэтому «перед первой подписью» не подходит.
 */
export function buildingsBeforeId(layers: LayerSpecification[]): string | undefined {
  let lastGeometry = -1
  layers.forEach((layer, index) => {
    if (layer.id !== BUILDINGS_LAYER_ID && !OWN_LAYER_TYPES.has(layer.type))
      lastGeometry = index
  })
  return layers.slice(lastGeometry + 1).find(layer => layer.id !== BUILDINGS_LAYER_ID)?.id
}

export function buildingsColor(base: ThemeBase): ExpressionSpecification {
  const [low, high] = COLORS[base]
  return ['interpolate', ['linear'], RAW_HEIGHT, 0, low, 80, high]
}

/**
 * Слой 3D-зданий. Непрозрачный: fill-extrusion-opacity < 1 применяется ко всему слою,
 * и сквозь здания становятся видны задние грани и соседние дома.
 */
export function createBuildingsLayer(base: ThemeBase): FillExtrusionLayerSpecification {
  return {
    'id': BUILDINGS_LAYER_ID,
    'type': 'fill-extrusion',
    'source': SOURCE_ID,
    'source-layer': SOURCE_LAYER,
    'minzoom': MIN_ZOOM,
    'paint': {
      'fill-extrusion-color': buildingsColor(base),
      'fill-extrusion-height': HEIGHT,
      'fill-extrusion-base': BASE,
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': true,
    },
  }
}
