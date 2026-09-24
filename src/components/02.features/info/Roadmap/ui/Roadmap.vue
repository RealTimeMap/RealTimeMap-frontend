<script setup lang="ts">
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import RoadmapTimeline from './RoadmapTimeline.vue'

const { close } = useDialogStore()
</script>

<template>
  <div class="roadmap-page">
    <div class="roadmap-header">
      <button
        class="button-back"
        type="button"
        @click="close"
      >
        <u-icon icon="app:arrow-left" />
      </button>
      <h2>Дорожная карта</h2>
    </div>

    <div class="roadmap-body">
      <p class="roadmap-lead">
        Куда движется RealTimeMap: что уже в работе и что мы планируем добавить.
        Список и приоритеты могут меняться.
      </p>

      <roadmap-timeline />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.roadmap-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
}

.roadmap-header {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;

  .button-back {
    @include glass-panel(12px, 10px, false);
  }

  h2 {
    @include value-text(24px, var(--text-color), 700);
  }
}

.roadmap-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-bottom: 20px;
}

.roadmap-lead {
  @include value-text(15px, var(--text-color), 500);
  line-height: 1.55;
}
</style>
