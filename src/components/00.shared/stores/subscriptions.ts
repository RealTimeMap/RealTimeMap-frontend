export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const mySubscriptionsCount = ref<number | null>(null)

  function setMySubscriptionsCount(count: number) {
    mySubscriptionsCount.value = count
  }

  function applySubscriptionDelta(delta: number) {
    if (mySubscriptionsCount.value != null)
      mySubscriptionsCount.value = Math.max(0, mySubscriptionsCount.value + delta)
  }

  return {
    mySubscriptionsCount,
    setMySubscriptionsCount,
    applySubscriptionDelta,
  }
})
