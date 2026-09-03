import type { UserAchievementItem } from '@/components/00.shared/services/achievement/index.type'
import { achievementApi } from '@/components/00.shared/services/achievement'

const PAGE_SIZE = 20

export function useAchievements(userId: number) {
  const items = ref<UserAchievementItem[]>([])
  const page = ref(0)
  const hasNext = ref(true)
  const total = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadMore() {
    if (isLoading.value || !hasNext.value)
      return

    isLoading.value = true
    error.value = null
    try {
      const res = await achievementApi.getAchiveUser({
        id: userId,
        page: page.value + 1,
        pageSize: PAGE_SIZE,
      })
      items.value.push(...res.items)
      page.value = res.page
      hasNext.value = res.hasNext
      total.value = res.total
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
    page,
    hasNext,
    total,
    isLoading,
    error,
    loadMore,
  }
}
