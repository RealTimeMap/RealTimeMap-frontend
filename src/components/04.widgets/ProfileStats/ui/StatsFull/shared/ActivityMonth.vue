<script setup lang="ts">
import type { StatsMonthy } from '@/components/00.shared/services/statistics/index.type'
import { statisticsApi } from '@/components/00.shared/services/statistics'

const props = defineProps<{
  userId: number
}>()
const stats = shallowRef<StatsMonthy[] | null>(null)
const isLoading = ref(false)
const error = ref<unknown | null>(null)

async function loadStats() {
  if (!props.userId)
    return

  isLoading.value = true
  error.value = null

  try {
    stats.value = await statisticsApi.fetchStats(props.userId, 'monthly')
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

const activeIndex = ref<number>(11)
const rotatedStats = computed(() => {
  if (!stats.value || stats.value.length === 0)
    return []
  const currentMonthIdx = new Date().getMonth()

  const data = [
    ...stats.value.slice(currentMonthIdx + 1),
    ...stats.value.slice(0, currentMonthIdx + 1),
  ]
  return data
})

const maxCount = computed(() => {
  if (!rotatedStats.value.length)
    return 0
  return Math.max(...rotatedStats.value.map(s => s.count), 1)
})

const chartData = computed(() => {
  return rotatedStats.value.map((item, index) => {
    const firstLetter = item.month ? item.month.charAt(0).toUpperCase() : ''
    return {
      ...item,
      label: firstLetter,
      height: item.count > 0 ? Math.max((item.count / maxCount.value) * 100, 15) : 5,
      isActive: index === activeIndex.value,
      isCurrentMonth: index === 11,
    }
  })
})

function selectBar(index: number) {
  activeIndex.value = index
}
</script>

<template>
  <div class="activity-widget">
    <h3 class="widget-title">
      АКТИВНОСТЬ ПО МЕСЯЦАМ
    </h3>

    <div
      class="chart-card"
    >
      <div class="bars-layout">
        <div
          v-for="(bar, index) in chartData"
          :key="index"
          class="bar-group"
          @click="selectBar(index)"
        >
          <transition name="fade-slide">
            <span
              v-if="bar.isActive"
              class="bar-value-tooltip"
            >
              {{ bar.count }}
            </span>
          </transition>

          <div
            class="bar-rect"
            :class="{
              'is-active': bar.isActive,
              'is-today': bar.isCurrentMonth,
            }"
            :style="{ height: `${bar.height}%` }"
          />

          <span
            class="bar-label"
            :class="{ 'is-active': bar.isActive }"
          >
            {{ bar.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.widget-title {
  @include label-text();
}
.chart-card {
  @include glass-panel(18px, 14px, true, false);
  height: 160px;
  display: flex;
  align-items: flex-end;
  margin-top: 6px;
}

.bars-layout {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  height: 110px;
  padding-bottom: 14px;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.bar-rect {
  width: 100%;
  max-width: 24px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--primary-color) 20%, transparent);
  transition:
    height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    box-shadow 0.3s ease;
  position: relative;

  &.is-active {
    background: var(--accent-gradient, linear-gradient(180deg, #5370f9 0%, #7c4dff 100%));
    box-shadow: 0 0 15px color-mix(in srgb, var(--primary-color) 60%, transparent);

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5);
    }
  }

  &.is-today:not(.is-active) {
    background: color-mix(in srgb, var(--primary-color) 40%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary-color) 60%, transparent);
  }
}

.bar-value-tooltip {
  position: absolute;
  top: -24px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-color);
  text-shadow: 0 0 10px color-mix(in srgb, var(--primary-color) 80%, transparent);
}

.bar-label {
  position: absolute;
  bottom: -24px;
  font-size: 11px;
  color: var(--text-color-muted);
  transition: color 0.3s ease;

  &.is-active {
    color: var(--text-color);
    font-weight: 700;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(5px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
