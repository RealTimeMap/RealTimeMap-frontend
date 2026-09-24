import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
} from 'maplibre-gl'
import type { ThemeBase } from '@/components/00.shared/lib/theme'

export const BUILDINGS_LAYER_ID = '3d-buildings'

/** Векторный источник и слой зданий в стилях CARTO (carto.streets). */
const SOURCE_ID = 'carto'
const SOURCE_LAYER = 'building'

/** Здания появляются только на городских зумах. */
const MIN_ZOOM = 13

/** Целевая прозрачность (используется и для анимации появления). */
export const BUILDINGS_OPACITY = 0.85

// Высота/база берутся из атрибутов тайла, если они есть, иначе — типовое значение.
const RAW_HEIGHT: ExpressionSpecification = [
  'case',
  ['has', 'render_height'],
  ['get', 'render_height'],
  ['has', 'height'],
  ['get', 'height'],
  12,
]

/** Высота с плавным «прорастанием» по зуму. */
export const BUILDINGS_HEIGHT: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  MIN_ZOOM,
  0,
  15.5,
  RAW_HEIGHT,
]

const BASE: ExpressionSpecification = [
  'case',
  ['has', 'render_min_height'],
  ['get', 'render_min_height'],
  ['has', 'min_height'],
  ['get', 'min_height'],
  0,
]

const COLORS: Record<ThemeBase, string> = {
  dark: '#2c313a',
  light: '#dfe3ea',
}

/**
 * Слой 3D-зданий. Ставится ПОД слой достопримечательностей, а сами модели
 * достопримечательностей рендерятся с очисткой depth-буфера — поэтому здания
 * их никогда не перекрывают.
 */
export function createBuildingsLayer(base: ThemeBase): FillExtrusionLayerSpecification {
  return {
    'id': BUILDINGS_LAYER_ID,
    'type': 'fill-extrusion',
    'source': SOURCE_ID,
    'source-layer': SOURCE_LAYER,
    'minzoom': MIN_ZOOM,
    'paint': {
      'fill-extrusion-color': COLORS[base],
      'fill-extrusion-height': BUILDINGS_HEIGHT,
      'fill-extrusion-base': BASE,
      'fill-extrusion-opacity': BUILDINGS_OPACITY,
    },
  }
}
