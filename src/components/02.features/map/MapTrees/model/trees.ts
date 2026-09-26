import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import type { PropSpot } from './props'
import type { Foliage, Season, SeasonBlend } from '@/components/00.shared/lib/season'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { mixHex } from '@/components/00.shared/lib/colorMix'
import { MAX_PROPS, PROP_SHARE, PROP_SPACING } from './props'

// --- Расстановка ---
// Отдельных деревьев в тайлах нет — только контуры лесов и газонов. Сажаем деревья сами:
// по сетке в метрах со сдвигом от хеша клетки. Сетка общая для всей карты, поэтому дерево
// стоит на том же месте при каждом открытии и одинаково в соседних тайлах

/**
 * Шаг сетки в метрах: лес гуще, в парке реже, на газоне — редкие одиночные. Густота не зависит от зума —
 * при приближении к участку на нём остаются те же деревья, новые не досаживаются.
 */
const SPACING = { wood: 20, park: 28, grass: 64 }
/** Предохранитель на случай огромного лесопарка в кадре — в обычном городе не срабатывает. */
const MAX_TREES = 4000
export const MAX_TREE_COUNT = Math.ceil(MAX_TREES * 1.3)
const CONIFER_SHARE = { wood: 0.35, park: 0.15, grass: 0.1 }
const PARK_SUBCLASSES = new Set(['park', 'garden', 'recreation_ground', 'village_green', 'cemetery'])
const METERS_PER_DEGREE_LAT = 110_540
const METERS_PER_DEGREE_LNG = 111_320
const LITTER_SIDES = 12

type Kind = keyof typeof SPACING
type Ring = GeoJSON.Position[]

/** Форма дерева: круглая крона, узкий тополь, ёлка. */
export type TreeForm = 'round' | 'tall' | 'fir'

/** Одно дерево: где стоит и чем отличается от соседей. Геометрию строит слой на видеокарте. */
export interface TreeSpot {
  lng: number
  lat: number
  form: TreeForm
  /** 0..1 — размер внутри своей формы. */
  size: number
  /** Один из четырёх оттенков листвы. */
  shade: number
  /** Поворот вокруг оси, радианы, — грани соседних деревьев не смотрят в одну сторону. */
  turn: number
  /** Когда дерево желтеет и облетает: 0 — первым, 1 — последним. Рисунок листопада постоянный. */
  phase: number
}

export interface CrownShape {
  base: number
  height: number
  diameter: number
  cone: boolean
}

export interface TreeShape {
  trunk: { height: number, diameter: number }
  crowns: CrownShape[]
}

/** Размеры частей дерева в метрах. Крона начинается чуть ниже верха ствола — без щели между ними. */
export function treeShape({ form, size }: TreeSpot): TreeShape {
  if (form === 'fir') {
    const height = 8 + size * 5
    const diameter = 4.4 + size * 1.6
    return {
      trunk: { height: 1.2, diameter: 0.45 },
      crowns: [
        { base: 1, height: height * 0.62, diameter, cone: true },
        { base: height * 0.4, height: height * 0.6, diameter: diameter * 0.68, cone: true },
      ],
    }
  }
  if (form === 'tall') {
    const trunk = 1.4 + size * 0.6
    return {
      trunk: { height: trunk, diameter: 0.45 },
      crowns: [{ base: trunk * 0.8, height: 8 + size * 5, diameter: 2.8 + size * 1.2, cone: false }],
    }
  }
  const trunk = 1.8 + size
  const diameter = 5 + size * 3
  return {
    trunk: { height: trunk, diameter: 0.55 },
    crowns: [{ base: trunk * 0.85, height: diameter * 0.95, diameter, cone: false }],
  }
}

/** Детерминированный хеш клетки → [0, 1). */
function hash(ix: number, iy: number, salt: number): number {
  let h = Math.imul(ix, 374_761_393) ^ Math.imul(iy, 668_265_263) ^ Math.imul(salt, 2_147_483_647)
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177)
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296
}

function kindOf(properties: Record<string, unknown>): Kind {
  if (properties.class === 'wood')
    return 'wood'
  return PARK_SUBCLASSES.has(String(properties.subclass)) ? 'park' : 'grass'
}

function insideRing([x, y]: number[], ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if ((yi! > y!) !== (yj! > y!) && x! < ((xj! - xi!) * (y! - yi!)) / (yj! - yi!) + xi!)
      inside = !inside
  }
  return inside
}

function polygons(geometry: GeoJSON.Geometry): Ring[][] {
  if (geometry.type === 'Polygon')
    return [geometry.coordinates]
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates
  return []
}

/** Ковёр листвы под деревом — плоский многоугольник вокруг ствола. */
function litter(spot: TreeSpot, radius: number): GeoJSON.Feature {
  const dLng = radius / (METERS_PER_DEGREE_LNG * Math.cos(spot.lat * Math.PI / 180))
  const dLat = radius / METERS_PER_DEGREE_LAT
  const ring = Array.from({ length: LITTER_SIDES }, (_, i) => {
    const angle = spot.turn + (i / LITTER_SIDES) * Math.PI * 2
    return [spot.lng + Math.cos(angle) * dLng, spot.lat + Math.sin(angle) * dLat]
  })
  return {
    type: 'Feature',
    properties: { shade: spot.shade, phase: spot.phase },
    geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]!]] },
  }
}

/** Клетка индекса зданий в градусах — около 50 м. */
const BUILDING_CELL = 0.0005

/**
 * Где стоят здания: газон в тайлах часто лежит и под домами, и без проверки дерево вырастало бы сквозь крышу.
 * Контуры разложены по клеткам сетки — точка проверяется только с домами своей клетки.
 */
function buildingIndex(buildings: GeoJSON.Feature[]): (point: number[]) => boolean {
  const cells = new Map<string, Ring[]>()
  for (const building of buildings) {
    for (const rings of polygons(building.geometry)) {
      const outer = rings[0]
      if (!outer || outer.length < 4)
        continue
      let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity]
      for (const [x, y] of outer) {
        west = Math.min(west, x!)
        east = Math.max(east, x!)
        south = Math.min(south, y!)
        north = Math.max(north, y!)
      }
      for (let cx = Math.floor(west / BUILDING_CELL); cx <= Math.floor(east / BUILDING_CELL); cx++) {
        for (let cy = Math.floor(south / BUILDING_CELL); cy <= Math.floor(north / BUILDING_CELL); cy++) {
          const key = `${cx}:${cy}`
          const list = cells.get(key)
          if (list)
            list.push(outer)
          else
            cells.set(key, [outer])
        }
      }
    }
  }
  return (point) => {
    const rings = cells.get(`${Math.floor(point[0]! / BUILDING_CELL)}:${Math.floor(point[1]! / BUILDING_CELL)}`)
    return !!rings?.some(ring => insideRing(point, ring))
  }
}

function formOf(kind: Kind, ix: number, iy: number): TreeForm {
  if (hash(ix, iy, 3) < CONIFER_SHARE[kind])
    return 'fir'
  return hash(ix, iy, 9) < 0.18 ? 'tall' : 'round'
}

export interface ViewBounds {
  west: number
  south: number
  east: number
  north: number
}

interface Plot {
  kind: Kind
  rings: Ring[]
  west: number
  south: number
  east: number
  north: number
}

function ringArea(ring: Ring, mx: number, my: number): number {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
    sum += (ring[j]![0]! * mx) * (ring[i]![1]! * my) - (ring[i]![0]! * mx) * (ring[j]![1]! * my)
  return Math.abs(sum) / 2
}

export interface Planting {
  trees: TreeSpot[]
  /** Места для сезонных мелочей в парках и на газонах. */
  props: PropSpot[]
  /** Ковёр листвы под лиственными — рисуется плоским слоем карты. */
  litter: GeoJSON.FeatureCollection
}

/** Сезонные мелочи — на редкой сетке в парках и на газонах; в лесу их не видно за деревьями. */
function plantProps(plots: Plot[], mx: number, my: number, inBuilding: (point: number[]) => boolean): PropSpot[] {
  const props: PropSpot[] = []
  const placed = new Set<string>()
  for (const { kind, rings, west, south, east, north } of plots) {
    if (kind === 'wood')
      continue
    const outer = rings[0]!
    for (let iy = Math.floor(south * my / PROP_SPACING); iy * PROP_SPACING / my <= north; iy++) {
      for (let ix = Math.floor(west * mx / PROP_SPACING); ix * PROP_SPACING / mx <= east; ix++) {
        const key = `${ix}:${iy}`
        if (placed.has(key) || hash(ix, iy, 21) > PROP_SHARE)
          continue
        const lng = (ix + 0.2 + hash(ix, iy, 22) * 0.6) * PROP_SPACING / mx
        const lat = (iy + 0.2 + hash(ix, iy, 23) * 0.6) * PROP_SPACING / my
        const point = [lng, lat]
        if (!insideRing(point, outer) || rings.slice(1).some(hole => insideRing(point, hole)) || inBuilding(point))
          continue
        placed.add(key)
        props.push({ lng, lat, turn: hash(ix, iy, 24) * Math.PI * 2, variant: hash(ix, iy, 25) })
        if (props.length >= MAX_PROPS)
          return props
      }
    }
  }
  return props
}

export function plantTrees(features: GeoJSON.Feature[], view: ViewBounds, buildings: GeoJSON.Feature[] = []): Planting {
  const inBuilding = buildingIndex(buildings)
  // Масштаб сетки по долготе — от широты, округлённой до градуса, а не от центра вида:
  // иначе при каждом сдвиге карты сетка чуть растягивается и деревья переезжают
  const gridLat = Math.round((view.south + view.north) / 2)
  const mx = METERS_PER_DEGREE_LNG * Math.cos(gridLat * Math.PI / 180)
  const my = METERS_PER_DEGREE_LAT

  // Видимые участки и оценка, сколько деревьев на них поместится
  const plots: Plot[] = []
  let estimate = 0
  for (const feature of features) {
    const kind = kindOf(feature.properties ?? {})
    for (const rings of polygons(feature.geometry)) {
      const outer = rings[0]
      if (!outer || outer.length < 4)
        continue
      let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity]
      for (const [x, y] of outer) {
        west = Math.min(west, x!)
        east = Math.max(east, x!)
        south = Math.min(south, y!)
        north = Math.max(north, y!)
      }
      // Только видимая часть — большой лесопарк целиком не нужен
      west = Math.max(west, view.west)
      east = Math.min(east, view.east)
      south = Math.max(south, view.south)
      north = Math.min(north, view.north)
      if (west >= east || south >= north)
        continue
      plots.push({ kind, rings, west, south, east, north })
      const visibleArea = Math.min(ringArea(outer, mx, my), (east - west) * mx * (north - south) * my)
      estimate += visibleArea / SPACING[kind] ** 2
    }
  }

  // Не влезаем в предохранитель — прореживаем равномерно по хешу клетки, а не обрезаем по порядку обхода:
  // иначе деревья достаются только первым участкам, а остальная часть экрана пустая
  const keep = Math.min(1, MAX_TREES / Math.max(estimate, 1))
  const planted = new Set<string>()
  const trees: TreeSpot[] = []
  const litters: GeoJSON.Feature[] = []
  const result = (): Planting => ({
    trees,
    props: plantProps(plots, mx, my, inBuilding),
    litter: { type: 'FeatureCollection', features: litters },
  })

  for (const { kind, rings, west, south, east, north } of plots) {
    const step = SPACING[kind]
    const outer = rings[0]!
    for (let iy = Math.floor(south * my / step); iy * step / my <= north; iy++) {
      for (let ix = Math.floor(west * mx / step); ix * step / mx <= east; ix++) {
        if (keep < 1 && hash(ix, iy, 7) > keep)
          continue
        const key = `${kind}:${ix}:${iy}`
        if (planted.has(key))
          continue
        const lng = (ix + 0.15 + hash(ix, iy, 1) * 0.7) * step / mx
        const lat = (iy + 0.15 + hash(ix, iy, 2) * 0.7) * step / my
        const point = [lng, lat]
        if (!insideRing(point, outer) || rings.slice(1).some(hole => insideRing(point, hole)) || inBuilding(point))
          continue
        planted.add(key)
        const spot: TreeSpot = {
          lng,
          lat,
          form: formOf(kind, ix, iy),
          size: hash(ix, iy, 4),
          shade: Math.floor(hash(ix, iy, 5) * 4),
          turn: hash(ix, iy, 6) * Math.PI,
          phase: hash(ix, iy, 8),
        }
        trees.push(spot)
        if (spot.form !== 'fir')
          litters.push(litter(spot, treeShape(spot).crowns[0]!.diameter * 0.65))
        // Запас на ошибку оценки — дальше не строим
        if (planted.size >= MAX_TREE_COUNT)
          return result()
      }
    }
  }
  return result()
}

// --- Цвета и видимость по сезону ---

interface Leaves {
  /** Четыре оттенка — у каждого дерева свой, лес не выглядит заливкой. */
  green: [string, string, string, string]
  autumn: [string, string, string, string]
  conifer: string
  twigs: string
  trunk: string
  snow: string
}

const LEAVES: Record<ThemeBase, Leaves> = {
  light: {
    green: ['#8fc27a', '#7fb46c', '#9dcc86', '#86bb72'],
    autumn: ['#e9b84c', '#e39a3b', '#d6c35a', '#cf7038'],
    conifer: '#5c9160',
    twigs: '#a8988a',
    trunk: '#a08a74',
    snow: '#eef3f7',
  },
  dark: {
    green: ['#2f5a33', '#27502c', '#366239', '#2b5530'],
    autumn: ['#8c6325', '#7f501f', '#8f7a30', '#733b1b'],
    conifer: '#1f4428',
    twigs: '#3d352f',
    trunk: '#3a3029',
    snow: '#5d6873',
  },
}

/** Весенняя листва светлее и сочнее летней. */
const SPRING_GREEN: Record<ThemeBase, Leaves['green']> = {
  light: ['#a8d88b', '#b6df98', '#98cc7e', '#aedb90'],
  dark: ['#3d6e37', '#467640', '#355f31', '#40703a'],
}

function shades(colors: Leaves['green']): ExpressionSpecification {
  return ['match', ['get', 'shade'], 0, colors[0], 1, colors[1], 2, colors[2], colors[3]]
}

/** Весна — доля весенней зелени в листве (0 — летняя). */
function greenFor(base: ThemeBase, blend: SeasonBlend): Leaves['green'] {
  const share = (season: Season) => season === 'spring' ? 1 : 0
  const spring = share(blend.from) * (1 - blend.t) + share(blend.to) * blend.t
  return LEAVES[base].green.map((color, i) => mixHex(color, SPRING_GREEN[base][i]!, spring)) as Leaves['green']
}

export interface TreeLook {
  base: ThemeBase
  blend: SeasonBlend
  foliage: Foliage
}

/** Облетевшее лиственное дерево стоит голыми ветками. */
export function isBare(spot: TreeSpot, foliage: Foliage): boolean {
  return spot.form !== 'fir' && spot.phase < foliage.fallen
}

/**
 * Цвет кроны: пожелтевшие — те, чья phase меньше доли пожелтевших;
 * хвоя и голые ветки под снегом светлеют. Считается один раз на смену сезона, не в кадре.
 */
export function crownPainter({ base, blend, foliage }: TreeLook): (spot: TreeSpot) => string {
  const leaves = LEAVES[base]
  const snowy = (color: string, amount: number) => mixHex(color, leaves.snow, foliage.snow * amount)
  const green = greenFor(base, blend)
  const twigs = snowy(leaves.twigs, 0.7)
  // У ёлок тоже чуть разные оттенки — иначе ельник сливается в пятно
  const firs = green.map(color => snowy(mixHex(leaves.conifer, color, 0.15), 0.45))
  return (spot) => {
    if (spot.form === 'fir')
      return firs[spot.shade]!
    if (isBare(spot, foliage))
      return twigs
    return spot.phase < foliage.turned ? leaves.autumn[spot.shade]! : green[spot.shade]!
  }
}

export function trunkColor(base: ThemeBase): string {
  return LEAVES[base].trunk
}

/** Листва лежит под облетевшими деревьями, пока её не засыплет снег. */
export function litterFilter(foliage: Foliage): FilterSpecification {
  return ['<', ['get', 'phase'], foliage.fallen]
}

export function litterColor(base: ThemeBase): ExpressionSpecification {
  return shades(LEAVES[base].autumn)
}

export function litterOpacity(foliage: Foliage): number {
  return Math.round(0.8 * (1 - foliage.snow) * 100) / 100
}
