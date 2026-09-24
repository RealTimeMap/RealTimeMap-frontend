import { loadProfileMarks, loadProfileStats, preloadImage } from '@/components/00.shared/lib/profileCache'
import { subscriptionApi } from '@/components/00.shared/services/subscriptions'
import { useSubscriptionsStore } from '@/components/00.shared/stores/subscriptions'
import { loadAchievementsWidget } from '../widgets/Achievements/model/cache'

export async function prefetchProfile(userId: number, avatar?: string): Promise<void> {
  const subscriptionsStore = useSubscriptionsStore()

  await Promise.allSettled([
    loadProfileStats(userId),
    loadProfileMarks(userId),
    loadAchievementsWidget(userId),
    subscriptionApi.getSubscriptions({ page: 1, pageSize: 1 })
      .then(res => subscriptionsStore.setMySubscriptionsCount(res.total)),
    avatar ? preloadImage(avatar, 'anonymous') : undefined,
  ])
}
