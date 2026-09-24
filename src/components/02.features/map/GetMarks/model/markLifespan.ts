import type { Mark } from '@/components/00.shared/services/mark/index.type'

/** Меньше этой доли срока — метка «скоро исчезнет» и мягко пульсирует. */
const EXPIRING_SHARE = 0.15
/** Или меньше часа до конца. */
const EXPIRING_MS = 60 * 60 * 1000

export interface Lifespan {
  /** Оставшаяся доля срока, 0..1. */
  remaining: number
  expiring: boolean
  endAt: number
}

interface DatedMark {
  startAt?: string
  endAt?: string
  date?: { startAt?: string, endAt?: string }
}

/**
 * Даты берутся из метки, если сервер их присылает в списке (`startAt`/`endAt` или `date.*`).
 * Без дат кольцо срока не показывается.
 */
export function markLifespan(mark: Mark, now: number): Lifespan | null {
  const dated = mark as Mark & DatedMark
  const start = Date.parse(dated.date?.startAt ?? dated.startAt ?? '')
  const end = Date.parse(dated.date?.endAt ?? dated.endAt ?? '')
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return null
  const remaining = Math.min(Math.max((end - now) / (end - start), 0), 1)
  return {
    remaining,
    expiring: remaining > 0 && (remaining < EXPIRING_SHARE || end - now < EXPIRING_MS),
    endAt: end,
  }
}
