import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import type { Foliage, Season, SeasonBlend } from '@/components/00.shared/lib/season'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { mixHex } from '@/components/00.shared/lib/colorMix'

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
const CONIFER_SHARE = { wood: 0.22, park: 0.06, grass: 0.04 }
const PARK_SUBCLASSES = new Set(['park', 'garden', 'recreation_ground', 'village_green', 'cemetery'])
const METERS_PER_DEGREE_LAT = 110_540
const METERS_PER_DEGREE_LNG = 111_320
const CROWN_SIDES = 10

type Kind = keyof typeof SPACING
type Ring = GeoJSON.Position[]

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

/** Ярус дерева — многоугольник вокруг точки: сверху круг, в 3D — объёмный диск. */
function disc(lng: number, lat: number, radius: number, turn: number): GeoJSON.Position[] {
  const dLng = radius / (METERS_PER_DEGREE_LNG * Math.cos(lat * Math.PI / 180))
  const dLat = radius / METERS_PER_DEGREE_LAT
  const ring = Array.from({ length: CROWN_SIDES }, (_, i) => {
    const angle = turn + (i / CROWN_SIDES) * Math.PI * 2
    return [lng + Math.cos(angle) * dLng, lat + Math.sin(angle) * dLat]
  })
  return [...ring, ring[0]!]
}

/**
 * Части дерева. twigs — голые ветки облетевшего лиственного дерева, узкая бурая «крона»;
 * litter — плоский ковёр листвы под ним. Какие части видны, решают фильтры слоёв по phase.
 */
type Part = 'trunk' | 'crown' | 'twigs' | 'litter'

/** phase — когда дерево желтеет и облетает: 0 — первым, 1 — последним. Рисунок листопада постоянный. */
function part(kind: Part, conifer: boolean, shade: number, phase: number, ring: GeoJSON.Position[], base: number, height: number): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: { part: kind, conifer, shade, phase, base, height },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

/**
 * Дерево из ярусов: у лиственного — уже снизу, шире в середине, уже сверху (округлая крона),
 * у ели — два сужающихся яруса. Ствол — тонкий столбик под кроной.
 */
function tree(lng: number, lat: number, conifer: boolean, size: number, shade: number, turn: number, phase: number): GeoJSON.Feature[] {
  if (conifer) {
    const height = 9 + size * 5
    const radius = 2.2 + size * 0.8
    return [
      part('trunk', true, shade, phase, disc(lng, lat, 0.35, turn), 0, 1.5),
      part('crown', true, shade, phase, disc(lng, lat, radius, turn), 1.5, height * 0.55),
      part('crown', true, shade, phase, disc(lng, lat, radius * 0.62, turn), height * 0.55, height),
    ]
  }
  const trunk = 2.5 + size * 1.2
  const top = trunk + 4.5 + size * 3
  const radius = 2.8 + size * 1.8
  const crown = top - trunk
  return [
    part('litter', false, shade, phase, disc(lng, lat, radius * 1.35, turn + 0.4), 0, 0),
    part('trunk', false, shade, phase, disc(lng, lat, 0.4, turn), 0, trunk),
    part('crown', false, shade, phase, disc(lng, lat, radius * 0.78, turn), trunk, trunk + crown * 0.25),
    part('crown', false, shade, phase, disc(lng, lat, radius, turn), trunk + crown * 0.25, trunk + crown * 0.75),
    part('crown', false, shade, phase, disc(lng, lat, radius * 0.72, turn), trunk + crown * 0.75, top),
    part('twigs', false, shade, phase, disc(lng, lat, radius * 0.42, turn), trunk, top * 0.95),
  ]
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

export function plantTrees(features: GeoJSON.Feature[], view: ViewBounds): GeoJSON.FeatureCollection {
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
  const trees: GeoJSON.Feature[] = []

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
        if (!insideRing(point, outer) || rings.slice(1).some(hole => insideRing(point, hole)))
          continue
        planted.add(key)
        const conifer = hash(ix, iy, 3) < CONIFER_SHARE[kind]
        trees.push(...tree(lng, lat, conifer, hash(ix, iy, 4), Math.floor(hash(ix, iy, 5) * 4), hash(ix, iy, 6) * Math.PI, hash(ix, iy, 8)))
        // Запас на ошибку оценки — дальше не строим
        if (planted.size >= MAX_TREES * 1.3)
          return { type: 'FeatureCollection', features: trees }
      }
    }
  }
  return { type: 'FeatureCollection', features: trees }
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

/**
 * Цвет частей дерева: пожелтевшие — те, чья phase меньше доли пожелтевших;
 * хвоя, ветки и стволы под снегом светлеют.
 */
export function treeColor(base: ThemeBase, blend: SeasonBlend, foliage: Foliage): ExpressionSpecification {
  const leaves = LEAVES[base]
  const snowy = (color: string, amount: number) => mixHex(color, leaves.snow, foliage.snow * amount)
  return [
    'case',
    ['==', ['get', 'part'], 'trunk'],
    leaves.trunk,
    ['==', ['get', 'part'], 'twigs'],
    snowy(leaves.twigs, 0.7),
    ['get', 'conifer'],
    snowy(leaves.conifer, 0.45),
    ['<', ['get', 'phase'], foliage.turned],
    shades(leaves.autumn),
    shades(greenFor(base, blend)),
  ]
}

/** Облетевшие лиственные стоят голыми ветками, остальные — с кроной; ковёр листвы — отдельный слой. */
export function treeFilter(foliage: Foliage): FilterSpecification {
  const fallen: ExpressionSpecification = ['all', ['!', ['get', 'conifer']], ['<', ['get', 'phase'], foliage.fallen]]
  return [
    'any',
    ['==', ['get', 'part'], 'trunk'],
    ['all', ['==', ['get', 'part'], 'crown'], ['!', fallen]],
    ['all', ['==', ['get', 'part'], 'twigs'], fallen],
  ]
}

/** Листва лежит под облетевшими деревьями, пока её не засыплет снег. */
export function litterFilter(foliage: Foliage): FilterSpecification {
  return ['all', ['==', ['get', 'part'], 'litter'], ['<', ['get', 'phase'], foliage.fallen]]
}

export function litterColor(base: ThemeBase): ExpressionSpecification {
  return shades(LEAVES[base].autumn)
}

export function litterOpacity(foliage: Foliage): number {
  return Math.round(0.8 * (1 - foliage.snow) * 100) / 100
}
