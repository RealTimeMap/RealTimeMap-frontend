<script setup lang="ts">
import type { StatsSummary } from '@/components/00.shared/services/statistics/index.type'
import { statisticsApi } from '@/components/00.shared/services/statistics'

const props = defineProps<{
  userId: number
}>()

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

const statsDisplay = computed(() => [
  { label: 'Метки', value: stats.value?.markCount ?? 0 },
  { label: 'Подписчики', value: stats.value?.subscribersCount ?? 0 },
  { label: 'Подписки', value: stats.value?.friendsCount ?? 0 },
])
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
      <div
        v-for="(item, index) in statsDisplay"
        :key="index"
        class="stats-item"
      >
        <span class="stats-value">{{ item.value }}</span>
        <span class="stats-label">{{ item.label }}</span>
      </div>
    </div>

    <div
      v-else-if="error"
      class="stats-error"
    >
      Ошибка загрузки
    </div>
  </div>
</template>

<style lang="scss" scoped src='./styles.scss' />
