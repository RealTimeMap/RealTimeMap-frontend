import type {
  DataDrivenPropertyValueSpecification,
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  LineLayerSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import type { ThemeBase } from '@/components/00.shared/lib/theme'

// --- Детализация дорог ---
// В тайлах CARTO нет полос и переходов, но есть класс дороги, одностороннее движение и подтипы
// (лестницы, велодорожки, трамвай). Из них рисуем условную разметку — как на навигаторах

export const CARTO_SOURCE = 'carto'
const SOURCE_LAYER = 'transportation'

const CENTER_LAYER = 'road-details-center'
const LANE_LEFT_LAYER = 'road-details-lane-left'
const LANE_RIGHT_LAYER = 'road-details-lane-right'
const EDGE_LEFT_LAYER = 'road-details-edge-left'
const EDGE_RIGHT_LAYER = 'road-details-edge-right'
const STEPS_LAYER = 'road-details-steps'
const CYCLE_LAYER = 'road-details-cycleway'
const TRAM_LAYER = 'road-details-tram'

export const OWN_LAYERS = [
  TRAM_LAYER,
  CYCLE_LAYER,
  STEPS_LAYER,
  EDGE_LEFT_LAYER,
  EDGE_RIGHT_LAYER,
  LANE_LEFT_LAYER,
  LANE_RIGHT_LAYER,
  CENTER_LAYER,
]

/** Слои линий, прозрачность которых гасит снег. */
export const MARKING_LAYERS = [CENTER_LAYER, LANE_LEFT_LAYER, LANE_RIGHT_LAYER, EDGE_LEFT_LAYER, EDGE_RIGHT_LAYER]

const MARKING_ZOOM = 16
const EDGE_ZOOM = 17

// --- Ширина дорог ---
// В стиле CARTO дороги узкие и перестают расти после 18-го зума: дома при приближении растут,
// а дороги остаются нитками. На городских зумах делаем их шире, а дальше ширина удваивается с каждым зумом

const ROAD_LAYER = /^(?:road|bridge|tunnel)_.*(?:fill|case)/
const GROW_UNTIL = 22
/** Во сколько раз шире стиля: на обзорных зумах как было, к 16-му — заметно шире. */
const WIDEN_FROM = 14
const WIDEN_FULL = 16
const WIDEN = 1.8

type Stop = [zoom: number, width: number]
interface Stops { base?: number, stops: Stop[] }

function isStops(value: unknown): value is Stops {
  return !!value && typeof value === 'object' && Array.isArray((value as Stops).stops)
    && (value as Stops).stops.every(stop => Array.isArray(stop) && typeof stop[1] === 'number')
}

function widen(zoom: number): number {
  const t = Math.min(Math.max((zoom - WIDEN_FROM) / (WIDEN_FULL - WIDEN_FROM), 0), 1)
  return 1 + (WIDEN - 1) * t
}

/** Ширина стиля на зуме: между ступенями — линейно, после последней — удваивается на каждый зум. */
function styleWidth(stops: Stop[], zoom: number): number {
  const next = stops.findIndex(([at]) => at >= zoom)
  if (next === 0)
    return stops[0]![1]
  if (next === -1) {
    const [lastZoom, lastWidth] = stops.at(-1)!
    return lastWidth * 2 ** (zoom - lastZoom)
  }
  const [z0, w0] = stops[next - 1]!
  const [z1, w1] = stops[next]!
  return w0 + (w1 - w0) * (zoom - z0) / (z1 - z0)
}

const round = (value: number) => Math.round(value * 100) / 100

function stopZooms(...lists: Stop[][]): number[] {
  const zooms = new Set(lists.flat().map(([zoom]) => zoom))
  const from = Math.min(...zooms)
  for (let zoom = Math.ceil(from); zoom <= GROW_UNTIL; zoom++)
    zooms.add(zoom)
  return [...zooms].filter(zoom => zoom >= from).sort((a, b) => a - b)
}

/** Ширина заливки на зуме с расширением и ростом. */
function roadFill(stops: Stop[], zoom: number): number {
  return styleWidth(stops, zoom) * widen(zoom)
}

function toExpression(stops: Stop[]): ExpressionSpecification {
  return ['interpolate', ['linear'], ['zoom'], ...stops.flat()] as ExpressionSpecification
}

/** Асфальт: дороги отличаются от фона и зданий, а белая разметка на нём читается. */
const ASPHALT: Record<ThemeBase, { major: string, minor: string, case: string }> = {
  light: { major: '#d3d7de', minor: '#e1e4e9', case: '#c1c6ce' },
  dark: { major: '#3a3f4a', minor: '#30343d', case: '#1f2228' },
}

function asphalt(id: string, base: ThemeBase): string {
  const colors = ASPHALT[base]
  if (id.includes('case'))
    return colors.case
  return /_(?:minor|service)_/.test(id) ? colors.minor : colors.major
}

/**
 * Дороги стиля CARTO: цвет асфальта и ширина. Применяется к стилю до загрузки (transformStyle),
 * поэтому погода и смена темы берут эти значения за исходные.
 * Обводка шире заливки на прежнюю кромку — кромка не толстеет.
 */
export function styleRoads(style: StyleSpecification, base: ThemeBase): StyleSpecification {
  const fills = new Map<string, Stop[]>()
  for (const layer of style.layers) {
    const width = layer.type === 'line' ? layer.paint?.['line-width'] : undefined
    if (ROAD_LAYER.test(layer.id) && isStops(width))
      fills.set(layer.id, width.stops)
  }
  const layers = style.layers.map((layer) => {
    const stops = fills.get(layer.id)
    if (layer.type !== 'line' || !stops)
      return layer
    const fill = layer.id.includes('case') ? fills.get(layer.id.replace('case', 'fill')) : undefined
    const grown: Stop[] = stopZooms(stops, fill ?? []).map((zoom) => {
      if (!fill)
        return [zoom, round(roadFill(stops, zoom))]
      const border = Math.max(0, styleWidth(stops, zoom) - styleWidth(fill, zoom))
      return [zoom, round(roadFill(fill, zoom) + border)]
    })
    return { ...layer, paint: { ...layer.paint, 'line-width': toExpression(grown), 'line-color': asphalt(layer.id, base) } }
  })
  return { ...style, layers }
}

/** Ширина заливки по классу в стилях CARTO (Positron и Dark Matter совпадают). */
const STYLE_FILL: Record<'major' | 'motorway' | 'other', Stop[]> = {
  major: [[13, 2], [14, 4], [15, 6], [16, 8], [17, 12], [18, 16]],
  motorway: [[13, 3], [14, 5], [15, 7], [16, 9], [17, 11], [18, 20]],
  other: [[13, 2], [14, 3], [15, 4], [16, 6], [17, 10], [18, 14]],
}

/** Доля ширины дороги этого класса — по ней от оси откладываются полосы и края. */
function acrossRoad(share: number | ExpressionSpecification): ExpressionSpecification {
  const stops: (number | ExpressionSpecification)[] = []
  for (let zoom = MARKING_ZOOM; zoom <= GROW_UNTIL; zoom++) {
    const at = (kind: keyof typeof STYLE_FILL) => round(roadFill(STYLE_FILL[kind], zoom))
    stops.push(zoom, ['*', share, ['match', ['get', 'class'], ['primary', 'trunk'], at('major'), 'motorway', at('motorway'), at('other')]])
  }
  return ['interpolate', ['linear'], ['zoom'], ...stops] as ExpressionSpecification
}

const MARKING_WIDTH: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], MARKING_ZOOM, 1, 18, 1.6, 20, 3, 22, 6]
const CENTER_WIDTH: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], MARKING_ZOOM, 1.2, 18, 2, 20, 4, 22, 8]

const MAJOR: ExpressionSpecification = ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk', 'motorway'], true, false]
const WIDE: ExpressionSpecification = ['match', ['get', 'class'], ['primary', 'trunk', 'motorway'], true, false]
const ONEWAY: ExpressionSpecification = ['==', ['get', 'oneway'], 1]
const NOT_TUNNEL: ExpressionSpecification = ['!=', ['get', 'brunnel'], 'tunnel']
const NOT_RAMP: ExpressionSpecification = ['!=', ['get', 'ramp'], 1]

interface Palette {
  center: string
  lane: string
  edge: string
  steps: string
  cycleway: string
  tram: string
}

/** Разметка белая, как на настоящем асфальте; на светлой карте края чуть прозрачнее. */
export const PALETTE: Record<ThemeBase, Palette> = {
  light: {
    center: '#ffffff',
    lane: '#ffffff',
    edge: 'rgba(255, 255, 255, 0.8)',
    steps: '#a9afb9',
    cycleway: '#7fb98f',
    tram: '#a3a9b3',
  },
  dark: {
    center: 'rgba(255, 255, 255, 0.55)',
    lane: 'rgba(255, 255, 255, 0.42)',
    edge: 'rgba(255, 255, 255, 0.22)',
    steps: '#636b7b',
    cycleway: '#3e7357',
    tram: '#5f6676',
  },
}

function line(
  id: string,
  filter: FilterSpecification,
  minzoom: number,
  color: string,
  width: DataDrivenPropertyValueSpecification<number>,
  extra: Partial<LineLayerSpecification['paint']> = {},
): LineLayerSpecification {
  return {
    'id': id,
    'type': 'line',
    'source': CARTO_SOURCE,
    'source-layer': SOURCE_LAYER,
    'minzoom': minzoom,
    'filter': filter,
    'layout': { 'line-cap': 'butt', 'line-join': 'round' },
    'paint': { 'line-color': color, 'line-width': width, ...extra },
  }
}

const ROADWAY: ExpressionSpecification[] = [MAJOR, NOT_TUNNEL, NOT_RAMP]

/** Край проезжей части — сплошная чуть внутри обочины. */
function edge(id: string, side: 1 | -1, color: string): LineLayerSpecification {
  return line(id, ['all', ...ROADWAY], EDGE_ZOOM, color, MARKING_WIDTH, { 'line-offset': acrossRoad(side * 0.42) })
}

/**
 * Пунктир между полосами. Односторонний проспект делится на три полосы (пунктиры на ±1/6 ширины),
 * двусторонняя широкая улица — по две в каждую сторону (±1/4). Узкие двусторонние — только ось.
 */
function lane(id: string, side: 1 | -1, color: string): LineLayerSpecification {
  const share: ExpressionSpecification = ['case', ONEWAY, side / 6, side / 4]
  return line(id, ['all', ...ROADWAY, ['any', ONEWAY, WIDE]], MARKING_ZOOM, color, MARKING_WIDTH, {
    'line-offset': acrossRoad(share),
    'line-dasharray': [4, 3],
  })
}

/** Все слои детализации для темы — в порядке OWN_LAYERS. */
export function createLayers(base: ThemeBase): LayerSpecification[] {
  const colors = PALETTE[base]
  return [
    // Трамвайные пути: две рельсы
    line(TRAM_LAYER, ['==', ['get', 'subclass'], 'tram'], MARKING_ZOOM, colors.tram, ['interpolate', ['linear'], ['zoom'], MARKING_ZOOM, 0.8, 19, 1.4], {
      'line-gap-width': ['interpolate', ['exponential', 2], ['zoom'], MARKING_ZOOM, 1.5, 18, 3, 20, 9, 22, 32],
    }),
    line(CYCLE_LAYER, ['==', ['get', 'subclass'], 'cycleway'], MARKING_ZOOM, colors.cycleway, ['interpolate', ['exponential', 2], ['zoom'], MARKING_ZOOM, 1.5, 18, 3, 20, 7, 22, 18]),
    // Ступени: короткие поперечные штрихи
    line(STEPS_LAYER, ['==', ['get', 'subclass'], 'steps'], MARKING_ZOOM, colors.steps, ['interpolate', ['exponential', 2], ['zoom'], MARKING_ZOOM, 3, 18, 6, 20, 14, 22, 34], {
      'line-dasharray': [0.25, 0.25],
    }),
    edge(EDGE_LEFT_LAYER, -1, colors.edge),
    edge(EDGE_RIGHT_LAYER, 1, colors.edge),
    lane(LANE_LEFT_LAYER, -1, colors.lane),
    lane(LANE_RIGHT_LAYER, 1, colors.lane),
    // Двустороннее движение — сплошная по оси
    line(CENTER_LAYER, ['all', ...ROADWAY, ['!', ONEWAY]], MARKING_ZOOM, colors.center, CENTER_WIDTH),
  ]
}

export function paintColors(base: ThemeBase): Array<[id: string, property: 'line-color', color: string]> {
  const colors = PALETTE[base]
  return [
    [TRAM_LAYER, 'line-color', colors.tram],
    [CYCLE_LAYER, 'line-color', colors.cycleway],
    [STEPS_LAYER, 'line-color', colors.steps],
    [EDGE_LEFT_LAYER, 'line-color', colors.edge],
    [EDGE_RIGHT_LAYER, 'line-color', colors.edge],
    [LANE_LEFT_LAYER, 'line-color', colors.lane],
    [LANE_RIGHT_LAYER, 'line-color', colors.lane],
    [CENTER_LAYER, 'line-color', colors.center],
  ]
}

/** Разметку засыпает снегом: при глубоком снеге остаётся лишь намёк. */
export function markingOpacity(snow: number): number {
  return round(1 - 0.75 * Math.min(Math.max(snow, 0), 1))
}

/** Сразу за последним слоем дорог и мостов стиля — ниже 3D-зданий и подписей. */
export function detailsBeforeId(layers: LayerSpecification[]): string | undefined {
  let last = -1
  layers.forEach((layer, index) => {
    if (/^(?:road|bridge|tunnel|rail)_?/.test(layer.id) && !layer.id.startsWith('roadname') && !layer.id.startsWith('road-details'))
      last = index
  })
  return layers.slice(last + 1).find(layer => !layer.id.startsWith('road-details'))?.id
}
