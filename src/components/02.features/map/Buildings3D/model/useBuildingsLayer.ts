import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  FillLayerSpecification,
  FilterSpecification,
  LayerSpecification,
  LightSpecification,
} from 'maplibre-gl'
import type { SunPosition } from '@/components/00.shared/lib/sun'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { sunPosition } from '@/components/00.shared/lib/sun'

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

/**
 * Общий контур здания, разбитого на части (building:parts): его стены совпадают со стенами частей,
 * и совпадающие грани мерцают рябью. По схеме тайлов такой контур в 3D не рисуется.
 */
const SOLID_BUILDING: FilterSpecification = ['!', ['to-boolean', ['get', 'hide_3d']]]

/** Цвет по высоте: объём читается без прозрачности. */
const COLORS: Record<ThemeBase, [low: string, high: string]> = {
  dark: ['#2b2f36', '#3b414b'],
  light: ['#ecebe7', '#dddbd5'],
}

type Stop = [altitude: number, value: number]
type ColorStop = [altitude: number, rgb: [number, number, number]]

/**
 * Цвет света по высоте солнца: ночью холодный лунный, у горизонта тёплый, днём белый.
 * Оттенки близки к белому: цвет света умножается на цвет зданий и насыщенный перекрашивает их целиком.
 */
const SUN_COLORS: ColorStop[] = [
  [-8, [236, 240, 255]],
  [0, [255, 238, 224]],
  [12, [255, 246, 236]],
  [35, [255, 255, 255]],
]

/** Интенсивность держим низкой: при стандартной 0.5 теневые стороны почти чёрные. */
const SUN_INTENSITY: Stop[] = [
  [-8, 0.14],
  [0, 0.2],
  [20, 0.26],
  [50, 0.3],
]

function interpolate<T>(stops: [number, T][], x: number, mix: (a: T, b: T, t: number) => T): T {
  const next = stops.findIndex(([at]) => at > x)
  if (next === 0)
    return stops[0]![1]
  if (next === -1)
    return stops.at(-1)![1]
  const [x0, a] = stops[next - 1]!
  const [x1, b] = stops[next]!
  return mix(a, b, (x - x0) / (x1 - x0))
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function toHex(rgb: number[]): string {
  return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Свет от настоящего солнца: направление — азимут солнца, наклон — его высота.
 * Привязан к карте, а не к экрану — при повороте карты тени остаются на своей стороне домов.
 * Ночью свет сверху и слабый, чтобы здания не становились плоскими.
 */
export function sunLight({ azimuth, altitude }: SunPosition): LightSpecification {
  const color = interpolate(SUN_COLORS, altitude, (a, b, t) => a.map((c, i) => lerp(c, b[i]!, t)) as [number, number, number])
  // Крыши освещаются тем слабее, чем ниже свет, — наклон держим в 20–45°, а солнце задаёт сторону теней
  const polar = altitude > 0 ? lerp(45, 20, Math.min(altitude / 60, 1)) : 30
  return {
    anchor: 'map',
    color: toHex(color),
    intensity: Math.round(interpolate(SUN_INTENSITY, altitude, lerp) * 100) / 100,
    position: [1.15, Math.round(azimuth), Math.round(polar)],
  }
}

/** Значения MapLibre по умолчанию — возвращаем их, когда здания выключают. */
export const DEFAULT_LIGHT: LightSpecification = {
  anchor: 'viewport',
  color: '#ffffff',
  intensity: 0.5,
  position: [1.15, 210, 30],
}

// --- Тени ---
// MapLibre не отбрасывает тени, поэтому считаем их сами: у каждого дома тень — выпуклая оболочка
// основания и основания, сдвинутого от солнца на длину тени. Слой — fill-extrusion высотой в пару сантиметров:
// у него прозрачность применяется ко всему слою разом, и пересечения теней не темнеют полосами

export const SHADOW_SOURCE_ID = '3d-buildings-shadow'
export const SHADOW_LAYER_ID = '3d-buildings-shadow'
const SHADOW_MIN_ZOOM = 14
/** Тени есть, пока солнце над горизонтом; у самого горизонта длина ограничена SHADOW_MAX_LENGTH_RATIO. */
const SHADOW_MIN_ALTITUDE = 0
/** К закату тени бледнеют: у горизонта — половина плотности, полная — с этой высоты солнца. */
const SHADOW_FULL_ALTITUDE = 10
const SHADOW_MAX_LENGTH_RATIO = 2.2
const METERS_PER_DEGREE_LAT = 110_540
const METERS_PER_DEGREE_LNG = 111_320

/** На светлой карте чёрная тень выглядит грязной — берём тёплый тёмный; на тёмной нужна плотнее, иначе не видна. */
const SHADOW_STYLE: Record<ThemeBase, { color: string, opacity: number }> = {
  light: { color: '#3d3627', opacity: 0.2 },
  dark: { color: '#000000', opacity: 0.7 },
}

/**
 * На тёмной карте земля почти чёрная, и тень темнее неё не видна. Поэтому днём землю слегка
 * подсвечиваем, как солнцем, а тени вырезают из подсветки тёмные участки. На светлой карте подсветка не нужна.
 */
export const SUNLIT_SOURCE_ID = '3d-buildings-sunlit'
export const SUNLIT_LAYER_ID = '3d-buildings-sunlit'
const SUNLIT_OPACITY: Record<ThemeBase, number> = { light: 0, dark: 0.07 }

export const SUNLIT_AREA: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] },
}

export const SNOW_LAYER_ID = '3d-buildings-snow'

export function isBuildingsLayer(id: string): boolean {
  return id === BUILDINGS_LAYER_ID || id === SHADOW_LAYER_ID || id === SUNLIT_LAYER_ID || id === SNOW_LAYER_ID
}

// --- Снег на крышах ---
// Тонкая белая шапка поверх каждого дома. Слой включён только при снеге: иначе геометрия
// зданий строилась бы дважды впустую

/** Толщина снежной шапки, м. */
const SNOW_CAP = 0.6
/** Меньше этого снега крыши не белеют — пороша тает на тёплых крышах первой. */
export const ROOF_SNOW_MIN = 0.3

const SNOW_COLOR: Record<ThemeBase, string> = { light: '#fbfdff', dark: '#aab3bd' }

export function createSnowLayer(base: ThemeBase, snow: number): FillExtrusionLayerSpecification {
  return {
    'id': SNOW_LAYER_ID,
    'type': 'fill-extrusion',
    'source': SOURCE_ID,
    'source-layer': SOURCE_LAYER,
    'minzoom': MIN_ZOOM,
    'filter': SOLID_BUILDING,
    'layout': { visibility: snow >= ROOF_SNOW_MIN ? 'visible' : 'none' },
    'paint': {
      'fill-extrusion-color': SNOW_COLOR[base],
      'fill-extrusion-base': HEIGHT,
      'fill-extrusion-height': byZoom(['+', RAW_HEIGHT, SNOW_CAP]),
      'fill-extrusion-opacity': snowOpacity(snow),
      'fill-extrusion-vertical-gradient': false,
    },
  }
}

export function snowColor(base: ThemeBase): string {
  return SNOW_COLOR[base]
}

export function snowOpacity(snow: number): number {
  return Math.round(Math.min(1, 0.4 + snow * 0.6) * 100) / 100
}

function sunFade(sun: SunPosition): number {
  return Math.min(0.5 + sun.altitude / SHADOW_FULL_ALTITUDE / 2, 1)
}

/** sunStrength — сколько солнца пробивается сквозь облака: 1 — ясно, около 0 — пасмурно или дождь. */
export function sunlitOpacity(base: ThemeBase, sun: SunPosition, sunStrength = 1): ExpressionSpecification | number {
  if (sun.altitude < SHADOW_MIN_ALTITUDE || !SUNLIT_OPACITY[base])
    return 0
  return ['interpolate', ['linear'], ['zoom'], SHADOW_MIN_ZOOM, 0, 15, Math.round(SUNLIT_OPACITY[base] * sunFade(sun) * sunStrength * 100) / 100]
}

export function createSunlitLayer(): FillLayerSpecification {
  return {
    id: SUNLIT_LAYER_ID,
    type: 'fill',
    source: SUNLIT_SOURCE_ID,
    minzoom: SHADOW_MIN_ZOOM,
    paint: { 'fill-color': '#ffffff', 'fill-opacity': 0 },
  }
}

export function shadowColor(base: ThemeBase): string {
  return SHADOW_STYLE[base].color
}

/** В пасмурную погоду тени почти пропадают — как и в жизни. */
export function shadowOpacity(base: ThemeBase, sun: SunPosition, sunStrength = 1): ExpressionSpecification | number {
  if (sun.altitude < SHADOW_MIN_ALTITUDE)
    return 0
  return ['interpolate', ['linear'], ['zoom'], SHADOW_MIN_ZOOM, 0, 15, Math.round(SHADOW_STYLE[base].opacity * sunFade(sun) * sunStrength * 100) / 100]
}

export function createShadowLayer(base: ThemeBase): FillExtrusionLayerSpecification {
  return {
    id: SHADOW_LAYER_ID,
    type: 'fill-extrusion',
    source: SHADOW_SOURCE_ID,
    minzoom: SHADOW_MIN_ZOOM,
    paint: {
      'fill-extrusion-color': shadowColor(base),
      'fill-extrusion-height': 0.02,
      'fill-extrusion-opacity': 0,
      'fill-extrusion-vertical-gradient': false,
    },
  }
}

type Point = [number, number]

function cross(o: Point, a: Point, b: Point): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

/** Выпуклая оболочка (монотонная цепочка). Долготы и широты можно брать как есть — оболочка не зависит от масштаба осей. */
function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const half = (list: Point[]) => {
    const hull: Point[] = []
    for (const point of list) {
      while (hull.length >= 2 && cross(hull.at(-2)!, hull.at(-1)!, point) <= 0)
        hull.pop()
      hull.push(point)
    }
    hull.pop()
    return hull
  }
  return [...half(sorted), ...half(sorted.reverse())]
}

function outerRings(geometry: GeoJSON.Geometry): GeoJSON.Position[][] {
  if (geometry.type === 'Polygon')
    return [geometry.coordinates[0]!]
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.map(polygon => polygon[0]!)
  return []
}

function featureHeight(properties: Record<string, unknown>): number {
  const value = properties.render_height ?? properties.height
  return typeof value === 'number' ? value : 12
}

/**
 * Тени домов. Id в тайлах не уникальны между домами, поэтому тень строится для каждого многоугольника,
 * а одинаковые копии дома из соседних тайлов отсеиваются по id и первой точке.
 */
export function buildShadows(features: GeoJSON.Feature[], sun: SunPosition, lat: number): GeoJSON.FeatureCollection {
  if (sun.altitude < SHADOW_MIN_ALTITUDE)
    return { type: 'FeatureCollection', features: [] }
  const ratio = Math.min(1 / Math.tan(sun.altitude * Math.PI / 180), SHADOW_MAX_LENGTH_RATIO)
  // Тень ложится в сторону, противоположную солнцу
  const away = (sun.azimuth + 180) * Math.PI / 180
  const perMeterLng = Math.sin(away) / (METERS_PER_DEGREE_LNG * Math.cos(lat * Math.PI / 180))
  const perMeterLat = Math.cos(away) / METERS_PER_DEGREE_LAT

  const seen = new Set<string>()
  const shadows: GeoJSON.Feature[] = []
  for (const feature of features) {
    if (feature.properties?.hide_3d)
      continue
    const length = featureHeight(feature.properties ?? {}) * ratio
    const dx = length * perMeterLng
    const dy = length * perMeterLat
    for (const ring of outerRings(feature.geometry)) {
      if (ring.length < 3)
        continue
      const key = `${feature.id}:${ring[0]![0]!.toFixed(7)},${ring[0]![1]!.toFixed(7)}:${ring.length}`
      if (seen.has(key))
        continue
      seen.add(key)
      const points = ring.map(([x, y]): Point => [x!, y!])
      const hull = convexHull([...points, ...points.map(([x, y]): Point => [x + dx, y + dy])])
      if (hull.length >= 3)
        shadows.push({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...hull, hull[0]!]] } })
    }
  }
  return { type: 'FeatureCollection', features: shadows }
}

export { sunPosition }

const OWN_LAYER_TYPES = new Set(['symbol', 'custom', 'heatmap'])

/**
 * Куда вставить здания: сразу после последнего слоя с геометрией стиля (дороги, мосты, заливки),
 * чтобы дороги не рисовались поверх крыш, но подписи остались выше.
 * В Positron часть подписей идёт раньше дорог, поэтому «перед первой подписью» не подходит.
 */
export function buildingsBeforeId(layers: LayerSpecification[]): string | undefined {
  let lastGeometry = -1
  layers.forEach((layer, index) => {
    if (!isBuildingsLayer(layer.id) && !OWN_LAYER_TYPES.has(layer.type))
      lastGeometry = index
  })
  return layers.slice(lastGeometry + 1).find(layer => !isBuildingsLayer(layer.id))?.id
}

/** Ночью в части домов «горит свет»: [приглушённый, яркий] тёплый оттенок. */
const NIGHT_LIT: Record<ThemeBase, [dim: string, bright: string]> = {
  dark: ['#3a3a36', '#54492f'],
  light: ['#eee6d6', '#f0dfbd'],
}

/** Солнце ниже этой высоты — сумерки кончились, в городе зажигается свет. */
const NIGHT_ALTITUDE = -3

export function isNight(sun: SunPosition): boolean {
  return sun.altitude < NIGHT_ALTITUDE
}

/**
 * Цвет по высоте, ночью часть домов светится. Какие — решает остаток от id: рисунок одинаковый
 * при каждой загрузке, без мигания. Смена выражения перезагружает тайлы, поэтому меняется только на закате и рассвете.
 */
export function buildingsColor(base: ThemeBase, night = false): ExpressionSpecification {
  const [low, high] = COLORS[base]
  const byHeight: ExpressionSpecification = ['interpolate', ['linear'], RAW_HEIGHT, 0, low, 80, high]
  if (!night)
    return byHeight
  const [dim, bright] = NIGHT_LIT[base]
  return ['match', ['%', ['to-number', ['id'], 0], 20], [0, 7], bright, [3, 11, 15], dim, byHeight]
}

/**
 * Слой 3D-зданий. Непрозрачный: fill-extrusion-opacity < 1 применяется ко всему слою,
 * и сквозь здания становятся видны задние грани и соседние дома.
 */
export function createBuildingsLayer(base: ThemeBase, night = false): FillExtrusionLayerSpecification {
  return {
    'id': BUILDINGS_LAYER_ID,
    'type': 'fill-extrusion',
    'source': SOURCE_ID,
    'source-layer': SOURCE_LAYER,
    'minzoom': MIN_ZOOM,
    'filter': SOLID_BUILDING,
    'paint': {
      'fill-extrusion-color': buildingsColor(base, night),
      'fill-extrusion-height': HEIGHT,
      'fill-extrusion-base': BASE,
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': true,
    },
  }
}
