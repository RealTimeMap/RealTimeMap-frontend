<script setup lang="ts">
import type { StatsSummary } from '@/components/00.shared/services/statistics/index.type'
import type { SubscriptionListType } from '@/components/02.features/Subscriptions'
import { statisticsApi } from '@/components/00.shared/services/statistics'
import { subscriptionApi } from '@/components/00.shared/services/subscriptions'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSubscriptionsStore } from '@/components/00.shared/stores/subscriptions'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import SubscriptionsModal from '@/components/02.features/Subscriptions'

const props = defineProps<{
  userId: number
}>()

const authStore = useAuthStore()
const dialog = useDialogStore()
const subscriptionsStore = useSubscriptionsStore()

const isOwn = computed(() => authStore.user?.userId === props.userId)

const stats = shallowRef<StatsSummary | null>(null)
const isLoading = ref(false)
const error = ref<unknown | null>(null)

async function loadStats() {
  if (!props.userId)
    return

  isLoading.value = true
  error.value = null

  try {
    stats.value = await statisticsApi.fetchStats(props.userId, 'summary')
  }
  catch (e) {
    error.value = e
    console.error('Failed to fetch stats:', e)
  }
  finally {
    isLoading.value = false
  }
}

loadStats()

async function loadMySubscriptionsCount() {
  if (!isOwn.value)
    return

  try {
    const res = await subscriptionApi.getSubscriptions({ page: 1, pageSize: 1 })
    subscriptionsStore.setMySubscriptionsCount(res.total)
  }
  catch (e) {
    console.error('Failed to fetch subscriptions count:', e)
  }
}

loadMySubscriptionsCount()

const subscribersDelta = ref(0)

function bumpSubscribers(delta: number) {
  subscribersDelta.value += delta
}

defineExpose({ bumpSubscribers })

const subscribersCount = computed(() => {
  const base = Number(stats.value?.subscribersCount ?? 0)
  return Math.max(0, base + subscribersDelta.value)
})

const subscriptionsCount = computed(() => {
  if (isOwn.value && subscriptionsStore.mySubscriptionsCount != null)
    return subscriptionsStore.mySubscriptionsCount
  return stats.value?.friendsCount ?? 0
})

const statsDisplay = computed<{ label: string, value: number | string, tab?: SubscriptionListType }[]>(() => [
  { label: 'Метки', value: stats.value?.markCount ?? 0 },
  { label: 'Подписчики', value: subscribersCount.value, tab: 'subscribers' },
  { label: 'Подписки', value: subscriptionsCount.value, tab: 'subscriptions' },
])

function openSubscriptions(tab?: SubscriptionListType) {
  if (!tab || !isOwn.value)
    return

  dialog.open(SubscriptionsModal, { initialTab: tab }, {
    title: 'Ваши связи',
    width: '400px',
    height: '80%',
    position: 'end center',
  })
}
</script>

<template>
  <div class="stats-container">
    <div
      v-if="isLoading"
      class="stats-card is-loading"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="stats-item"
      >
        <div class="skeleton-value" />
        <div class="skeleton-label" />
      </div>
    </div>
    <div
      v-else-if="stats"
      class="stats-card"
    >
      <button
        v-for="(item, index) in statsDisplay"
        :key="index"
        class="stats-item"
        type="button"
        :class="{ 'stats-item--clickable': item.tab && isOwn }"
        :disabled="!item.tab || !isOwn"
        @click="openSubscriptions(item.tab)"
      >
        <span class="stats-value">{{ item.value }}</span>
        <span class="stats-label">{{ item.label }}</span>
      </button>
    </div>

    <u-block-error
      v-else-if="error"
      compact
      title="Статистика недоступна"
      :retrying="isLoading"
      @retry="loadStats"
    />
  </div>
</template>

<style lang="scss" scoped src='./styles.scss' />
