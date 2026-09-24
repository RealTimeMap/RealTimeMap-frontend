import type { Mark } from '@/components/00.shared/services/mark/index.type'
import type { StatsSummary } from '@/components/00.shared/services/statistics/index.type'
import { markApi } from '@/components/00.shared/services/mark'
import { statisticsApi } from '@/components/00.shared/services/statistics'

export interface ProfileMarksPreview {
  items: Mark[]
  total: number
}

export const PROFILE_MARKS_PREVIEW_SIZE = 4

export const profileStatsCache = new Map<number, StatsSummary>()
export const profileMarksCache = new Map<number, ProfileMarksPreview>()

const preloadedImages = new Map<string, HTMLImageElement>()

export async function loadProfileStats(userId: number): Promise<StatsSummary> {
  const stats = await statisticsApi.fetchStats(userId, 'summary')
  profileStatsCache.set(userId, stats)
  return stats
}

export async function loadProfileMarks(userId: number): Promise<ProfileMarksPreview> {
  const data = await markApi.getAllMarks({
    userid: userId,
    page: 1,
    pageSize: PROFILE_MARKS_PREVIEW_SIZE,
  })
  const preview = { items: data.items, total: data.total }
  profileMarksCache.set(userId, preview)
  return preview
}

export function isSameStats(a: StatsSummary, b: StatsSummary): boolean {
  const keys = Object.keys(a) as (keyof StatsSummary)[]
  return keys.length === Object.keys(b).length && keys.every(k => a[k] === b[k])
}

export function isSameMarksPreview(a: ProfileMarksPreview, b: ProfileMarksPreview): boolean {
  return a.total === b.total
    && a.items.length === b.items.length
    && a.items.every((it, i) => {
      const o = b.items[i]
      return o && it.id === o.id && it.markName === o.markName && it.photos[0] === o.photos[0]
    })
}

export function preloadImage(src: string, crossOrigin?: 'anonymous'): Promise<void> {
  if (preloadedImages.has(src))
    return Promise.resolve()
  const img = new Image()
  if (crossOrigin)
    img.crossOrigin = crossOrigin
  img.src = src
  preloadedImages.set(src, img)
  return img.decode().catch(() => {})
}
