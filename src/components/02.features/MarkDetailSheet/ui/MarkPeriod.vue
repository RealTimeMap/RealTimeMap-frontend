<script setup lang="ts">
import { pluralize } from '@/helpers/date/FormatDate'

defineProps<{
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
</script>

<template>
  <div class="period-block">
    <div class="period-block__header">
      <u-icon icon="line-md:calendar" />
      <span class="label-text">Период активности</span>

      <u-flag
        :status="meta.status"
      >
        {{ meta.status }}
      </u-flag>
    </div>

    <div class="period-block__content" />

    <u-drawer v-if="date.daysPassed > 0" />
    <div
      v-if="date.daysPassed > 0"
      class="period-block__footer"
    >
      <div class="date-block">
        <span class="date-block__text">
          Прошло:
        </span>
        <span class="date-block__value">
          {{ pluralize(date.daysPassed, DAY_TITLES) }}
        </span>
      </div>

      <div class="date-block">
        <span class="date-block__text">
          Осталось:
        </span>
        <span class="date-block__value primary">
          {{ pluralize(date.daysLeft, DAY_TITLES) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.period-block {
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(38.4px) saturate(180%);
  background: rgba(18, 24, 38, 0.45);
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    rgba(255, 255, 255, 0.06) 0px 1px 0px inset,
    rgba(0, 0, 0, 0.35) 0px 10px 30px;
  padding: 14px;

  display: flex;
  flex-direction: column;
  gap: 10px;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
      color: var(--primary-color);
    }

    .u-flag {
      margin-left: auto;
    }

    .label-text {
      font-size: 10px;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.date-block {
  font-size: 10px;

  &__text {
    color: rgba(255, 255, 255, 0.55);
  }

  &__value {
    color: rgb(255, 255, 255);
    font-weight: 600;

    &.primary {
      color: var(--primary-color);
    }
  }
}
</style>
