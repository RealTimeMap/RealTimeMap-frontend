<script setup lang="ts">
import { pluralize } from '@/components/00.shared/lib/date/FormatDate'

const props = defineProps<{
  date: {
    startAt: string
    endAt: string
    progressPercent: number
    daysPassed: number
    daysLeft: number
  }
  meta: {
    status: string
  }
}>()

const DAY_TITLES: [string, string, string] = ['день', 'дня', 'дней']
const isMultiDayPeriod = computed(() => (props.date.daysPassed + props.date.daysLeft) > 0)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).replace(' г.', '')
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="period-block">
    <div class="period-block__header">
      <u-icon
        icon="mynaui:calendar"
        class="header-icon"
      />
      <span class="label-text">ПЕРИОД АКТИВНОСТИ</span>
      <u-flag
        :status="meta.status"
        class="status-flag"
      >
        {{ meta.status }}
      </u-flag>
    </div>

    <div class="period-block__content">
      <div class="activity-row">
        <div class="time-info">
          <span class="time-info__label">НАЧАЛО</span>
          <span class="time-info__date">{{ formatDate(date.startAt) }}</span>
          <span class="time-info__time">{{ formatTime(date.startAt) }}</span>
        </div>

        <div class="custom-progress">
          <div class="glow-dot" />
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${date.progressPercent}%` }"
            />
          </div>
          <div class="end-ring" />
        </div>

        <div class="time-info end">
          <span class="time-info__label">КОНЕЦ</span>
          <span class="time-info__date">{{ formatDate(date.endAt) }}</span>
          <span class="time-info__time">{{ formatTime(date.endAt) }}</span>
        </div>
      </div>
    </div>

    <template v-if="isMultiDayPeriod">
      <u-drawer />
      <div class="period-block__footer">
        <div class="footer-stats">
          <span class="footer-stats__text">Прошло: </span>
          <span class="footer-stats__value">{{ pluralize(date.daysPassed, DAY_TITLES) }}</span>
        </div>
        <div class="footer-stats">
          <span class="footer-stats__text">Осталось: </span>
          <span class="footer-stats__value primary">{{ pluralize(date.daysLeft, DAY_TITLES) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.period-block {
  @include glass-panel(16px, 14px);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      color: #00a3ff;
      width: 18px;
      height: 18px;
    }

    .label-text {
      @include label-text();
    }

    .status-flag {
      margin-left: auto;
    }
  }
}

.activity-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.time-info {
  display: flex;
  flex-direction: column;
  min-width: max-content;

  &.end {
    align-items: flex-end;
    text-align: right;
  }

  &__label {
    @include label-text(8px);
    margin-bottom: 6px;
    letter-spacing: 1px;
  }

  &__date {
    @include value-text(14px);
  }

  &__time {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.25);
    margin-top: 2px;
    font-weight: 500;
  }
}

.custom-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;

  .glow-dot {
    width: 7px;
    height: 7px;
    background: #00a3ff;
    border-radius: 50%;
    box-shadow: 0 0 15px 2px rgba(0, 163, 255, 0.5);
  }

  .progress-track {
    flex-grow: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    position: relative;
  }

  .progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: #00a3ff;
    border-radius: 10px;
  }

  .end-ring {
    width: 8px;
    height: 8px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    border-radius: 50%;
  }
}

.period-block__footer {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
}

.footer-stats {
  font-size: 13px;
  &__text {
    color: rgba(255, 255, 255, 0.3);
  }
  &__value {
    color: #fff;
    font-weight: 700;
    &.primary {
      color: #00a3ff;
    }
  }
}
</style>
