import type { SubscriptionUser } from '@/components/00.shared/services/subscriptions/index.type'
import { subscriptionApi } from '@/components/00.shared/services/subscriptions'
import { useSubscriptionsStore } from '@/components/00.shared/stores/subscriptions'

export type SubscriptionListType = 'subscriptions' | 'subscribers'

const PAGE_SIZE = 20

export function useSubscriptionList(type: SubscriptionListType) {
  const items = ref<SubscriptionUser[]>([])
  const total = ref(0)
  const page = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref<unknown | null>(null)

  const subscriptionsStore = useSubscriptionsStore()

  const fetcher = type === 'subscriptions'
    ? subscriptionApi.getSubscriptions
    : subscriptionApi.getSubscribers

  async function loadMore() {
    if (isLoading.value || isLoadingMore.value || !hasMore.value)
      return

    const nextPage = page.value + 1
    const initial = nextPage === 1

    if (initial)
      isLoading.value = true
    else
      isLoadingMore.value = true

    error.value = null

    try {
      const res = await fetcher({ page: nextPage, pageSize: PAGE_SIZE })
      items.value.push(...res.items)
      total.value = res.total
      page.value = res.page
      hasMore.value = res.hasNext

      if (type === 'subscriptions')
        subscriptionsStore.setMySubscriptionsCount(res.total)
    }
    catch (e) {
      error.value = e
      console.error('[Subscription list]', e)
    }
    finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  function reload() {
    items.value = []
    total.value = 0
    page.value = 0
    hasMore.value = true
    error.value = null
    loadMore()
  }

  return {
    items,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    reload,
  }
}
