<script setup lang="ts">
import ActivityMonth from './shared/ActivityMonth.vue'
import Heatmap from './shared/Heatmap.vue'

defineProps<{
  userId: number
}>()
</script>

<template>
  <div class="stats-container">
    <activity-month :user-id="userId" />
    <heatmap :user-id="userId" />
  </div>
</template>

<style lang="scss" scoped>
.stats-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>
