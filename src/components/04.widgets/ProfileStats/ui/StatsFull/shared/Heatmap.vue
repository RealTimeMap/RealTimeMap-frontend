<script setup lang="ts">
import type { StatsHeatmap } from '@/components/00.shared/services/statistics/index.type'
import { statisticsApi } from '@/components/00.shared/services/statistics'

interface DayItem {
  day: string
  count: number
}

interface MappedDay extends DayItem {
  level: number
}

interface ActiveDay extends MappedDay {
  x: number
  y: number
}

interface MonthLabel {
  name: string
  col: number
}

const props = defineProps<{
  userId: number
}>()

const stats = shallowRef<StatsHeatmap | null>(null)
const isLoading = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const activeDay = ref<ActiveDay | null>(null)

const weekDays = ['', 'Mon', '', 'Wed', '', 'Fri', '']

async function loadStats() {
  if (!props.userId)
    return
  isLoading.value = true

  const end = new Date()
  const start = new Date()
  start.setFullYear(start.getFullYear() - 1)
  const dayOfWeek = start.getDay()
  start.setDate(start.getDate() - dayOfWeek)

  try {
    const data = await statisticsApi.fetchStats(props.userId, 'heatmap', {
      start: start.toISOString(),
      end: end.toISOString(),
    })
    stats.value = data

    await nextTick()
    if (scrollContainer.value) {
      scrollContainer.value.scrollLeft = scrollContainer.value.scrollWidth
    }
  }
  catch (e) {
    console.error('Heatmap load error:', e)
  }
  finally {
    isLoading.value = false
  }
}

const monthLabels = computed<MonthLabel[]>(() => {
  if (!stats.value)
    return []
  const labels: MonthLabel[] = []
  stats.value.items.forEach((item: DayItem, index: number) => {
    const date = new Date(item.day)
    if (date.getDate() !== 1)
      return
    labels.push({
      name: date.toLocaleString('en-US', { month: 'short' }),
      col: Math.floor(index / 7),
    })
  })
  return labels
})

function getLevel(count: number): number {
  if (count <= 0)
    return 0
  if (count <= 2)
    return 1
  if (count <= 5)
    return 2
  if (count <= 8)
    return 3
  return 4
}

const days = computed<MappedDay[]>(() => {
  if (!stats.value)
    return []
  return stats.value.items.map((item: DayItem) => ({
    ...item,
    level: getLevel(item.count),
  }))
})

function handleCellClick(event: MouseEvent, day: MappedDay) {
  const target = event.currentTarget as HTMLElement
  if (activeDay.value?.day === day.day) {
    activeDay.value = null
    return
  }

  const rect = target.getBoundingClientRect()
  activeDay.value = {
    ...day,
    x: rect.left + rect.width / 2,
    y: rect.top + window.scrollY,
  }
}

function closeTooltip() {
  if (activeDay.value)
    activeDay.value = null
}

onMounted(() => {
  window.addEventListener('scroll', closeTooltip, true)
})

onUnmounted(() => {
  window.removeEventListener('scroll', closeTooltip, true)
})

loadStats()
</script>

<template>
  <div class="heatmap-widget">
    <h3 class="widget-title">
      Тепловая карта · публикации
    </h3>

    <div class="heatmap-container">
      <div
        ref="scrollContainer"
        class="heatmap-scroll-area"
        @scroll="closeTooltip"
      >
        <div class="heatmap-layout">
          <div class="month-row">
            <div
              v-for="(month, idx) in monthLabels"
              :key="idx"
              class="month-label"
              :style="{ gridColumnStart: month.col + 1 }"
            >
              {{ month.name }}
            </div>
          </div>

          <div class="grid-body">
            <div class="days-column">
              <div
                v-for="(day, idx) in weekDays"
                :key="idx"
                class="day-label"
              >
                {{ day }}
              </div>
            </div>

            <div class="heatmap-grid">
              <template v-if="!isLoading">
                <div
                  v-for="(day, index) in days"
                  :key="index"
                  class="day-cell"
                  :class="[`level-${day.level}`, { 'is-active': activeDay?.day === day.day }]"
                  @click="handleCellClick($event, day)"
                />
              </template>

              <div
                v-for="i in 357"
                v-else
                :key="i"
                class="day-cell level-0"
                style="opacity: 0.1"
              />
            </div>
          </div>
        </div>
      </div>

      <teleport to="body">
        <transition name="pop">
          <div
            v-if="activeDay"
            class="cell-tooltip"
            :style="{ left: `${activeDay.x}px`, top: `${activeDay.y - 8}px` }"
          >
            {{ activeDay.count }}
            <div class="tooltip-arrow" />
          </div>
        </transition>
      </teleport>

      <div class="heatmap-footer">
        <div class="legend">
          <span class="meta-text">Less</span>
          <div class="legend-cells">
            <div
              v-for="i in 5"
              :key="i"
              class="day-cell"
              :class="`level-${i - 1}`"
            />
          </div>
          <span class="meta-text">More</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.heatmap-widget {
  width: 100%;
}

.widget-title {
  @include label-text();
}

.heatmap-container {
  @include glass-panel(18px, 14px, true, false);
  overflow: hidden;
  margin-top: 6px;
}

.heatmap-scroll-area {
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
}

.heatmap-layout {
  min-width: max-content;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.month-row {
  display: grid;
  grid-template-columns: repeat(54, 18px);
  gap: 4px;
  margin-left: 32px;
  height: 14px;
}

.month-label {
  font-size: 9px;
  color: var(--text-color-muted);
  font-weight: 600;
}

.grid-body {
  display: flex;
}

.days-column {
  position: sticky;
  left: 0;
  z-index: 10;
  width: 32px;
  display: grid;
  grid-template-rows: repeat(7, 18px);
  gap: 4px;
}

.day-label {
  font-size: 9px;
  color: var(--text-color-muted);
  height: 18px;
  display: flex;
  align-items: center;
}

.heatmap-grid {
  display: grid;
  grid-template-rows: repeat(7, 18px);
  grid-auto-flow: column;
  gap: 4px;
}

.day-cell {
  width: 18px;
  height: 18px;
  background: var(--surface-subtle);
  border-radius: 3px;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    transform: scale(1.1);
  }
  &.is-active {
    box-shadow: 0 0 0 2px #fff;
  }

  &.level-1 {
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
  }
  &.level-2 {
    background: color-mix(in srgb, var(--primary-color) 35%, transparent);
  }
  &.level-3 {
    background: color-mix(in srgb, var(--primary-color) 60%, transparent);
  }
  &.level-4 {
    background: var(--primary-color);
    box-shadow: 0 0 10px color-mix(in srgb, var(--primary-color) 40%, transparent);
  }
}

.heatmap-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  .legend-cells {
    display: flex;
    gap: 3px;
    .day-cell {
      width: 10px;
      height: 10px;
      cursor: default;
    }
  }
}

.meta-text {
  font-size: 9px;
  color: var(--text-color-muted);
  text-transform: uppercase;
  font-weight: 700;
}
</style>

<style lang="scss">
.cell-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: #fff;
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
  z-index: 9999;
  pointer-events: none;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));

  .tooltip-arrow {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid #fff;
  }
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -80%) scale(0.5);
}
</style>
