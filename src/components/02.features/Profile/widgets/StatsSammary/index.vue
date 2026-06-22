<script setup lang="ts">
import type { StatsSummary } from '@/utils/statistics/index.type'
import { statisticsApi } from '@/utils/statistics'

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
</script>

<template>
  <div class="stats-container">
    <div v-if="isLoading">
      Загрузка...
    </div>
    <div v-else-if="error">
      Ошибка загрузки
    </div>
    <pre v-else>{{ stats }}</pre>
  </div>
</template>
