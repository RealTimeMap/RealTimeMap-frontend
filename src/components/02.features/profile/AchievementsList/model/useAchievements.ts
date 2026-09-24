import type { CatalogAchievement } from '@/components/00.shared/services/achievement/index.type'
import { achievementApi } from '@/components/00.shared/services/achievement'

const CATALOG_SIZE = 500
const UNLOCKED_FETCH_SIZE = 500

export function useAchievements(userId: number) {
  const items = ref<CatalogAchievement[]>([])
  const unlockedIds = ref<Set<number>>(new Set())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const total = computed(() => items.value.length)
  const earnedCount = computed(
    () => items.value.filter(a => unlockedIds.value.has(a.id)).length,
  )

  async function loadUnlocked() {
    if (!userId)
      return
    try {
      const res = await achievementApi.getAchiveUser({
        id: userId,
        page: 1,
        pageSize: UNLOCKED_FETCH_SIZE,
      })
      const ids = new Set<number>()
      for (const it of res.items) {
        ids.add(it.achievement.id)
        if (it.achievement.next)
          ids.add(it.achievement.next.id)
      }
      unlockedIds.value = ids
    }
    catch (e) {
      console.error('[Achievements unlocked]', e)
    }
  }

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      const [all] = await Promise.all([
        achievementApi.getAllAchievements({ page: 1, pageSize: CATALOG_SIZE }),
        loadUnlocked(),
      ])
      items.value = Array.isArray(all) ? all : []
    }
    catch (e) {
      console.error('[Achievements]', e)
      error.value = 'Не удалось загрузить достижения'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    items,
    unlockedIds,
    total,
    earnedCount,
    isLoading,
    error,
    load,
  }
}
