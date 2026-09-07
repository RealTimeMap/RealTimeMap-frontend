import { subscriptionApi } from '@/components/00.shared/services/subscriptions'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useSubscriptionsStore } from '@/components/00.shared/stores/subscriptions'

interface UseSubscriptionOptions {
  enabled?: () => boolean
  onChange?: (subscribed: boolean) => void
}
export function useSubscription(
  getUserId: () => number | undefined,
  options: UseSubscriptionOptions = {},
) {
  const notification = useNotificationStore()
  const subscriptionsStore = useSubscriptionsStore()

  const isSubscribed = ref(false)
  const isLoadingStatus = ref(false)
  const isPending = ref(false)

  const isEnabled = () => options.enabled?.() ?? true

  async function fetchStatus() {
    const id = getUserId()
    if (!id || !isEnabled())
      return

    isLoadingStatus.value = true
    try {
      const { subscribed } = await subscriptionApi.getStatus(id)
      isSubscribed.value = subscribed
    }
    catch (e) {
      console.error('[Subscription status]', e)
    }
    finally {
      isLoadingStatus.value = false
    }
  }

  async function toggle() {
    const id = getUserId()
    if (!id || isPending.value)
      return

    const next = !isSubscribed.value
    isPending.value = true
    isSubscribed.value = next
    options.onChange?.(next)
    subscriptionsStore.applySubscriptionDelta(next ? 1 : -1)

    try {
      if (next)
        await subscriptionApi.subscribe(id)
      else
        await subscriptionApi.unsubscribe(id)
    }
    catch (e) {
      isSubscribed.value = !next
      options.onChange?.(!next)
      subscriptionsStore.applySubscriptionDelta(next ? -1 : 1)
      notification.add({
        title: next ? 'Не удалось подписаться' : 'Не удалось отписаться',
        description: (e as { message?: string })?.message,
        type: 'error',
      })
    }
    finally {
      isPending.value = false
    }
  }

  watch(getUserId, (id) => {
    if (id)
      fetchStatus()
  }, { immediate: true })

  return {
    isSubscribed,
    isLoadingStatus,
    isPending,
    toggle,
    fetchStatus,
  }
}
