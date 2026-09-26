import type { TreeLook } from './trees'
import type { ThemeBase } from '@/components/00.shared/lib/theme'

// --- Сезонные мелочи в парках ---
// Осенью тыквы, весной клумбы, зимой снеговики — если лежит снег. Летом парки и так зелёные.
// Места расставляются вместе с деревьями, а что на них стоит — решает сезон при отрисовке:
// сменился сезон — пересаживать ничего не нужно. Собраны из тех же форм, что и деревья, —
// новых вызовов отрисовки нет, только экземпляры

export type PropKind = 'pumpkins' | 'flowers' | 'snowman'

/** Место для мелочи: где стоит и чем отличается от соседних. */
export interface PropSpot {
  lng: number
  lat: number
  turn: number
  /** 0..1 — сколько тыкв, какие цветы. */
  variant: number
}

/** Шаг сетки мелочей, м: одна-две на небольшой сквер, в парке — редкими пятнами. */
export const PROP_SPACING = 70
/** Не на каждой клетке — иначе расстановка видна как сетка. */
export const PROP_SHARE = 0.55
export const MAX_PROPS = 300
/** Самая сложная мелочь — клумба: основа и до семи бутонов. */
export const MAX_PROP_PARTS = 8

/** Мелочи в «игрушечном» масштабе, как и деревья: в настоящем размере на карте это пара пикселей. */
const PROP_SCALE = 1.9
/** Снеговики — только когда снег правда лежит. */
const SNOWMAN_SNOW = 0.3

export function propKind({ blend, foliage }: TreeLook): PropKind | null {
  const season = blend.t < 0.5 ? blend.from : blend.to
  if (season === 'winter')
    return foliage.snow >= SNOWMAN_SNOW ? 'snowman' : null
  if (season === 'autumn')
    return 'pumpkins'
  return season === 'spring' ? 'flowers' : null
}

export type PropShape = 'blob' | 'cone' | 'trunk'

/** Часть мелочи: форма, сдвиг от места в метрах (x — восток, z — юг), размеры и цвет. */
export interface PropPart {
  shape: PropShape
  dx: number
  dz: number
  base: number
  height: number
  width: number
  color: string
}

const COLORS: Record<ThemeBase, { pumpkin: string, stem: string, snow: string, carrot: string, hat: string, bed: string }> = {
  light: { pumpkin: '#ec8a2c', stem: '#5f7d3b', snow: '#e8eef5', carrot: '#f2862a', hat: '#2d3440', bed: '#72ab5c' },
  dark: { pumpkin: '#b9661e', stem: '#3f5a2a', snow: '#cdd5de', carrot: '#c96c1e', hat: '#1b1f27', bed: '#2f5a33' },
}
const FLOWERS = ['#f26b8a', '#ffd23f', '#ffffff', '#b28dff', '#ff8c42']

/** Части мелочи в масштабе карты. */
export function propParts(kind: PropKind, spot: PropSpot, base: ThemeBase): PropPart[] {
  return shapeParts(kind, spot, base).map(part => ({
    ...part,
    dx: part.dx * PROP_SCALE,
    dz: part.dz * PROP_SCALE,
    base: part.base * PROP_SCALE,
    height: part.height * PROP_SCALE,
    width: part.width * PROP_SCALE,
  }))
}

function shapeParts(kind: PropKind, spot: PropSpot, base: ThemeBase): PropPart[] {
  const colors = COLORS[base]
  if (kind === 'pumpkins') {
    // Одна, две или три тыквы рядом, разного размера
    const count = 1 + Math.floor(spot.variant * 3)
    return Array.from({ length: count }, (_, i) => {
      const angle = spot.turn + i * 2.1
      const size = 2.3 - i * 0.45
      const dx = i ? Math.cos(angle) * 2.2 : 0
      const dz = i ? Math.sin(angle) * 2.2 : 0
      return [
        { shape: 'blob' as const, dx, dz, base: 0, height: size * 0.7, width: size, color: colors.pumpkin },
        { shape: 'trunk' as const, dx, dz, base: size * 0.62, height: size * 0.3, width: 0.35, color: colors.stem },
      ]
    }).flat()
  }
  if (kind === 'snowman') {
    // Нос смотрит в сторону поворота места
    const noseX = Math.sin(spot.turn) * 0.75
    const noseZ = -Math.cos(spot.turn) * 0.75
    return [
      { shape: 'blob', dx: 0, dz: 0, base: 0, height: 2.4, width: 2.5, color: colors.snow },
      { shape: 'blob', dx: 0, dz: 0, base: 2, height: 1.8, width: 1.9, color: colors.snow },
      { shape: 'blob', dx: 0, dz: 0, base: 3.5, height: 1.3, width: 1.35, color: colors.snow },
      { shape: 'blob', dx: noseX, dz: noseZ, base: 4, height: 0.35, width: 0.45, color: colors.carrot },
      // Тёмная шапка — снеговик не теряется на белом
      { shape: 'blob', dx: 0, dz: 0, base: 4.6, height: 0.55, width: 1.05, color: colors.hat },
    ]
  }
  // Клумба: низкий зелёный пуф и бутоны по кругу
  const buds = 5 + Math.floor(spot.variant * 3)
  return [
    { shape: 'blob', dx: 0, dz: 0, base: 0, height: 0.9, width: 4.6, color: colors.bed },
    ...Array.from({ length: buds }, (_, i) => {
      const angle = spot.turn + (i / buds) * Math.PI * 2
      const radius = i % 2 ? 1.2 : 0.6
      return {
        shape: 'blob' as const,
        dx: Math.cos(angle) * radius,
        dz: Math.sin(angle) * radius,
        base: 0.55,
        height: 0.7,
        width: 0.8,
        color: FLOWERS[(i + Math.floor(spot.variant * FLOWERS.length)) % FLOWERS.length]!,
      }
    }),
  ]
}
