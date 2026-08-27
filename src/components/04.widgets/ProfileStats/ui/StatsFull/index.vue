<script setup lang="ts">
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import StatsModal from './modal.vue'

const { userId } = defineProps<{
  userId: number
}>()

const { open } = useDialogStore()

function handleOpenStats() {
  open(StatsModal, {
    userId,
  }, {
    width: '400px',
    position: 'end center',
    headerModal: false,
  })
}
</script>

<template>
  <div
    class="stats-container"
    @click="handleOpenStats()"
  >
    <u-icon
      class="icon"
      icon="arcticons:stats-royale"
      width="16"
    />
    Подробная статистика
    <u-icon
      class="arrow icon"
      icon="weui:arrow-filled"
      width="12px"
      height="12px"
    />
  </div>
</template>

<style lang="scss" scoped>
.stats-container {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  @include glass-panel(12px, 8px 14px, false);

  background: oklch(0.62 0.22 265 / 0.12);
  border: 0.5px solid oklch(0.62 0.22 265 / 0.3);

  .arrow {
    margin-left: auto;
  }

  .icon {
    color: rgb(83, 112, 249);
  }
}
</style>
