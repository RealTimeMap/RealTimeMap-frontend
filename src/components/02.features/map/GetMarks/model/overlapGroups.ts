import type { Mark } from '@/components/00.shared/services/mark/index.type'

export interface MarkGroup {
  /** Стабильный ключ — id первой метки группы: не меняется при пересчёте на том же зуме. */
  key: string
  /** Точка, вокруг которой группа показывается и раскрывается веером. */
  anchor: [number, number]
  marks: Mark[]
}

/** Метки ближе этого расстояния на экране визуально сливаются в одну. */
const OVERLAP_PX = 28

/**
 * Группирует метки, которые на текущем зуме почти совпадают на экране.
 * Считаем в пикселях, а не по сетке координат: у сетки метки по разные стороны границы ячейки
 * попадали в разные группы, даже стоя в паре метров друг от друга.
 */
export function groupOverlapping(
  marks: readonly Mark[],
  project: (coordinates: [number, number]) => { x: number, y: number },
): MarkGroup[] {
  const groups: Array<MarkGroup & { point: { x: number, y: number } }> = []
  const sorted = [...marks].sort((a, b) => a.id - b.id)
  for (const mark of sorted) {
    const coordinates = mark.geom.coordinates as [number, number]
    const point = project(coordinates)
    const near = groups.find(g => Math.hypot(g.point.x - point.x, g.point.y - point.y) < OVERLAP_PX)
    if (near)
      near.marks.push(mark)
    else
      groups.push({ key: `g${mark.id}`, anchor: coordinates, point, marks: [mark] })
  }
  return groups.map(({ key, anchor, marks }) => ({ key, anchor, marks }))
}

/**
 * Смещения веера в пикселях от общей точки. До 5 меток — дугой над точкой («букет»),
 * до 8 — по кругу, больше — по спирали, чтобы метки не налезали друг на друга.
 */
export function fanOffsets(count: number): Array<[number, number]> {
  const polar = (angle: number, radius: number): [number, number] =>
    [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)]

  if (count <= 5) {
    const spread = Math.PI * (0.35 + count * 0.12)
    const start = -Math.PI / 2 - spread / 2
    const step = count > 1 ? spread / (count - 1) : 0
    return Array.from({ length: count }, (_, i) => polar(start + step * i, 52 + count * 4))
  }
  if (count <= 8)
    return Array.from({ length: count }, (_, i) => polar((i / count) * Math.PI * 2 - Math.PI / 2, 58 + count * 2))
  return Array.from({ length: count }, (_, i) => polar(i * 0.9 - Math.PI / 2, 40 + i * 7))
}
