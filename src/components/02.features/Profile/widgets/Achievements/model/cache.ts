import type { NearestAchievementItem } from '@/components/00.shared/services/achievement/index.type'

export interface WidgetData {
  nearest: NearestAchievementItem[]
  total: number
  earned: number
}

export const achievementsWidgetCache = new Map<number, WidgetData>()

export function isSameWidgetData(a: WidgetData, b: WidgetData): boolean {
  return a.total === b.total
    && a.earned === b.earned
    && a.nearest.length === b.nearest.length
    && a.nearest.every((it, i) => {
      const o = b.nearest[i]
      return o
        && it.achievement.id === o.achievement.id
        && it.current === o.current
        && it.threshold === o.threshold
        && it.progress === o.progress
    })
}
