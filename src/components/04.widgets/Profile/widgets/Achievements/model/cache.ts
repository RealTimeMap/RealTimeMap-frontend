import type { NearestAchievementItem } from '@/components/00.shared/services/achievement/index.type'
import { achievementApi } from '@/components/00.shared/services/achievement'

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

export async function loadAchievementsWidget(userId: number): Promise<WidgetData> {
  const [nearest, all, earned] = await Promise.all([
    achievementApi.getNearestAchievements(userId),
    achievementApi.getAllAchievements({ page: 1, pageSize: 500 }),
    achievementApi.getAchiveUser({ id: userId, page: 1, pageSize: 1 }),
  ])
  const data: WidgetData = {
    nearest: nearest.items,
    total: Array.isArray(all) ? all.length : 0,
    earned: earned.total ?? 0,
  }
  achievementsWidgetCache.set(userId, data)
  return data
}
