import { roadWidthPx } from './roadDetails'

// --- Разметка проезжей части ---
// Разметку рисуем не прямо по тайлам, а считаем: у перекрёстков и слияний линии одной дороги
// иначе ложатся поверх полотна соседней. Конец дороги, лежащий на точке другой дороги, — стык:
// разметка обрывается там, где её линии сходят с чужого полотна. Заодно — стоп-линии перед
// перекрёстками и зебры там, где тротуар пересекает дорогу (в OSM это общая точка)

export interface MarkingsRequest {
  features: GeoJSON.Feature[]
  zoom: number
  lat: number
}

type Point = [number, number]

interface Road {
  id: string | number
  roadClass: string
  oneway: boolean
  marked: boolean
  coords: Point[]
}

interface Touch {
  road: number
  at: number
}

const MARKED = new Set(['primary', 'secondary', 'tertiary', 'trunk', 'motorway'])
const VEHICLE = new Set([...MARKED, 'minor', 'service'])
const FOOT = new Set(['footway', 'crossing', 'path', 'pedestrian'])

/** Две дороги, сходящиеся почти по прямой, — продолжение одной улицы, а не перекрёсток. */
const CONTINUATION_COS = Math.cos(30 * Math.PI / 180)
/** Под острым углом — слияние: стоп-линии нет. */
const STOP_MIN_SIN = Math.sin(35 * Math.PI / 180)
/** Ниже этого синуса обрезка росла бы неограниченно — почти параллельные полосы. */
const MIN_SIN = 0.45

const key = ([lng, lat]: Point) => `${lng.toFixed(6)},${lat.toFixed(6)}`

/** Метры на пиксель: MapLibre считает тайл в 512 px. */
function metersPerPixel(zoom: number, lat: number): number {
  return 40_075_016.686 * Math.cos(lat * Math.PI / 180) / (512 * 2 ** zoom)
}

function lines(geometry: GeoJSON.Geometry): Point[][] {
  if (geometry.type === 'LineString')
    return [geometry.coordinates as Point[]]
  if (geometry.type === 'MultiLineString')
    return geometry.coordinates as Point[][]
  return []
}

/**
 * Куски одной дороги из соседних тайлов перекрываются в буфере тайла. Склеиваем по общей точке,
 * иначе пунктир в перекрытии рисуется дважды и сбивается. Части одной мультилинии (группы) не склеиваются:
 * CARTO собирает в один объект целую сеть улиц, и их общие точки — перекрёстки.
 * Проход линейный: точки всех линий в одном индексе.
 */
export function mergePieces(groups: Point[][][]): Point[][] {
  const result: Point[][] = []
  const groupOf: number[] = []
  const owner = new Map<string, number>()
  const remember = (line: number) => {
    for (const point of result[line]!)
      owner.set(key(point), line)
  }
  groups.forEach((group, groupIndex) => {
    for (const line of group) {
      if (line.length < 2)
        continue
      const j = line.findIndex((point) => {
        const other = owner.get(key(point))
        return other !== undefined && groupOf[other] !== groupIndex
      })
      if (j === -1) {
        result.push(line)
        groupOf.push(groupIndex)
        remember(result.length - 1)
        continue
      }
      const target = owner.get(key(line[j]!))!
      const first = result[target]!
      if (line.every(point => owner.get(key(point)) === target))
        continue
      const shared = key(line[j]!)
      const i = first.findIndex(point => key(point) === shared)
      const head = j > i ? line.slice(0, j) : first.slice(0, i)
      const tail = line.length - j > first.length - i ? line.slice(j + 1) : first.slice(i + 1)
      result[target] = [...head, first[i]!, ...tail]
      remember(target)
    }
  })
  return result
}

/** Плоские метры вокруг широты запроса — на масштабе улицы искажений нет. */
function projector(lat: number) {
  const ky = 110_540
  const kx = 111_320 * Math.cos(lat * Math.PI / 180)
  const toMeters = ([lng, lat]: Point): Point => [lng * kx, lat * ky]
  const toDegrees = ([x, y]: Point): Point => [x / kx, y / ky]
  return { toMeters, toDegrees }
}

function unit([x, y]: Point): Point {
  const length = Math.hypot(x, y) || 1
  return [x / length, y / length]
}

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]]
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]]
const scale = (a: Point, k: number): Point => [a[0] * k, a[1] * k]
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1]
const cross = (a: Point, b: Point) => a[0] * b[1] - a[1] * b[0]

/** Обрезает начало линии (в метрах); null — если от линии ничего не осталось. */
function trimStart(coords: Point[], meters: number): Point[] | null {
  if (meters <= 0)
    return coords
  let left = meters
  for (let i = 1; i < coords.length; i++) {
    const segment = Math.hypot(...sub(coords[i]!, coords[i - 1]!))
    if (segment > left) {
      const t = left / segment
      const start = add(coords[i - 1]!, scale(sub(coords[i]!, coords[i - 1]!), t))
      return [start, ...coords.slice(i)]
    }
    left -= segment
  }
  return null
}

function trimEnd(coords: Point[], meters: number): Point[] | null {
  const reversed = trimStart([...coords].reverse(), meters)
  return reversed && reversed.reverse()
}

export function computeMarkings({ features, zoom, lat }: MarkingsRequest): GeoJSON.FeatureCollection {
  const { toMeters, toDegrees } = projector(lat)
  const mpp = metersPerPixel(zoom, lat)
  const width = (roadClass: string) => roadWidthPx(roadClass, zoom) * mpp

  // Дороги: куски одного id склеены
  const pieces = new Map<string | number, { feature: GeoJSON.Feature, groups: Point[][][] }>()
  const footPoints = new Set<string>()
  for (const feature of features) {
    const props = feature.properties ?? {}
    if (props.class === 'path' && FOOT.has(props.subclass)) {
      for (const line of lines(feature.geometry)) {
        for (const point of line)
          footPoints.add(key(point))
      }
      continue
    }
    if (!VEHICLE.has(props.class) || feature.id == null)
      continue
    const entry = pieces.get(feature.id) ?? { feature, groups: [] }
    entry.groups.push(lines(feature.geometry))
    pieces.set(feature.id, entry)
  }

  const roads: Road[] = []
  for (const [id, { feature, groups }] of pieces) {
    const props = feature.properties ?? {}
    const marked = MARKED.has(props.class) && props.brunnel !== 'tunnel' && props.ramp !== 1
    for (const coords of mergePieces(groups))
      roads.push({ id, roadClass: props.class, oneway: props.oneway === 1, marked, coords })
  }

  // Какие дороги проходят через каждую точку
  const touches = new Map<string, Touch[]>()
  roads.forEach((road, index) => {
    road.coords.forEach((point, at) => {
      const list = touches.get(key(point))
      if (list)
        list.push({ road: index, at })
      else
        touches.set(key(point), [{ road: index, at }])
    })
  })

  const meters = roads.map(road => road.coords.map(toMeters))
  /** Направление линии в точке (вдоль дороги). */
  const along = (road: number, at: number): Point => {
    const coords = meters[road]!
    return unit(sub(coords[Math.min(at + 1, coords.length - 1)]!, coords[Math.max(at - 1, 0)]!))
  }

  const output: GeoJSON.Feature[] = []
  const lineFeature = (coords: Point[], properties: Record<string, unknown>): GeoJSON.Feature => ({
    type: 'Feature',
    properties,
    geometry: { type: 'LineString', coordinates: coords.map(toDegrees) },
  })

  interface Junction { trim: number, stop: boolean }

  /**
   * Стык в точке at дороги index: на сколько обрезать разметку участка, уходящего в сторону away,
   * и нужна ли стоп-линия. На конце дороги соседняя дорога по прямой — продолжение улицы, не стык.
   */
  function junctionAt(index: number, at: number, away: Point): Junction {
    const road = roads[index]!
    const touching = (touches.get(key(road.coords[at]!)) ?? []).filter(touch => touch.road !== index)
    // Улица в OSM режется на отрезки у каждого проезда: отрезок, идущий дальше почти по прямой, — та же улица
    const continues = (touch: Touch) => {
      const coords = meters[touch.road]!
      if (touch.at !== 0 && touch.at !== coords.length - 1)
        return false
      const otherAway = unit(sub(coords[touch.at === 0 ? 1 : touch.at - 1]!, coords[touch.at]!))
      return dot(away, otherAway) < -CONTINUATION_COS
    }
    const continued = touching.some(continues)
    // Улица продолжается — разметку рвут только пересечения с размеченными дорогами, а не проезды во дворы
    const others = touching.filter(touch => !continues(touch) && (!continued || roads[touch.road]!.marked))
    if (!others.length)
      return { trim: 0, stop: false }
    const own = width(road.roadClass)
    let trim = 0
    let minSin = 1
    for (const other of others) {
      const direction = along(other.road, other.at)
      const sin = Math.abs(cross(away, direction))
      const cos = Math.abs(dot(away, direction))
      minSin = Math.min(minSin, sin)
      // Линии разметки (до половины своей ширины от оси) должны сойти с полотна соседней дороги
      const needed = (width(roads[other.road]!.roadClass) / 2 + own / 2 * cos) / Math.max(sin, MIN_SIN)
      trim = Math.max(trim, needed + own * 0.15)
    }
    return { trim, stop: minSin >= STOP_MIN_SIN }
  }

  /** Внутренние точки, где дорогу пересекает другая размеченная: там перекрёсток, разметка рвётся. */
  function crossings(index: number): number[] {
    const road = roads[index]!
    const cuts: number[] = []
    for (let at = 1; at < road.coords.length - 1; at++) {
      const others = touches.get(key(road.coords[at]!)) ?? []
      if (others.some(touch => touch.road !== index && roads[touch.road]!.marked))
        cuts.push(at)
    }
    return cuts
  }

  roads.forEach((road, index) => {
    if (!road.marked)
      return
    const all = meters[index]!
    const cuts = [0, ...crossings(index), all.length - 1]
    const halfWidth = width(road.roadClass) / 2 * 0.92
    // Стоп-линия: поперёк полос, которые едут к перекрёстку (правостороннее движение)
    const stopLine = (point: Point, towards: Point) => {
      const right: Point = [towards[1], -towards[0]]
      const from = road.oneway ? add(point, scale(right, -halfWidth)) : point
      output.push(lineFeature([from, add(point, scale(right, halfWidth))], { kind: 'stop', class: road.roadClass }))
    }

    for (let c = 1; c < cuts.length; c++) {
      const a = cuts[c - 1]!
      const b = cuts[c]!
      const part = all.slice(a, b + 1)
      if (part.length < 2)
        continue
      const start = junctionAt(index, a, unit(sub(part[1]!, part[0]!)))
      const end = junctionAt(index, b, unit(sub(part.at(-2)!, part.at(-1)!)))
      let coords: Point[] | null = trimStart(part, start.trim)
      coords = coords && trimEnd(coords, end.trim)
      if (!coords || coords.length < 2)
        continue
      output.push(lineFeature(coords, { kind: 'road', class: road.roadClass, oneway: road.oneway ? 1 : 0 }))
      if (end.stop && end.trim > 0)
        stopLine(coords.at(-1)!, unit(sub(coords.at(-1)!, coords.at(-2)!)))
      if (start.stop && start.trim > 0 && !road.oneway)
        stopLine(coords[0]!, unit(sub(coords[0]!, coords[1]!)))
    }
  })

  // Зебры: тротуар и размеченная дорога делят точку
  const zebras = new Set<string>()
  roads.forEach((road, index) => {
    if (!road.marked)
      return
    road.coords.forEach((point, at) => {
      const id = key(point)
      if (!footPoints.has(id) || zebras.has(id) || at === 0 || at === road.coords.length - 1)
        return
      zebras.add(id)
      const direction = along(index, at)
      const across: Point = [direction[1], -direction[0]]
      const half = width(road.roadClass) / 2 * 0.85
      const center = meters[index]![at]!
      output.push(lineFeature([add(center, scale(across, -half)), add(center, scale(across, half))], { kind: 'zebra', class: road.roadClass }))
    })
  })

  return { type: 'FeatureCollection', features: output }
}
