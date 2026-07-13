<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  /**
   * Icon name from Iconify collection
   * @example 'mdi:home' or 'lucide:arrow-left'
   */
  icon: string
  width?: string | number
  height?: string | number
}>()
</script>

<template>
  <icon
    :icon="icon"
    :width="width"
    :height="height"
  />
</template>

<style scoped>
.iconify {
  color: inherit;
}
</style>
