<script setup lang="ts">
const props = defineProps<{
  title?: string
  min?: Date
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const model = defineModel<Date | null>()

const minDate = computed(() => props.min ? new Date(props.min) : new Date())
const initial = model.value
  ? (new Date(model.value) < minDate.value ? new Date(minDate.value) : new Date(model.value))
  : null
const tempDate = ref<Date | null>(initial)
const viewDate = ref<Date>(initial ?? new Date(minDate.value))

const formatLong = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})
const formatMonthYear = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

const displayTempDate = computed(() => tempDate.value ? formatLong.format(tempDate.value) : '')
const displayViewMonth = computed(() => {
  const str = formatMonthYear.format(viewDate.value)
  return str.charAt(0).toUpperCase() + str.slice(1).replace(' г.', '')
})

const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

const MINUTE_STEP = 5
const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP)

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const emptySlots = firstDayIndex === 0 ? 6 : firstDayIndex - 1

  return { daysInMonth, emptySlots }
})

const minDayStart = computed(() => {
  const d = minDate.value
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
})

const isPrevDisabled = computed(() => {
  const y = viewDate.value.getFullYear()
  const m = viewDate.value.getMonth()
  return y < minDate.value.getFullYear()
    || (y === minDate.value.getFullYear() && m <= minDate.value.getMonth())
})

const selectedHour = computed(() => (tempDate.value ?? minDate.value).getHours())
const selectedMinute = computed(() => {
  const m = (tempDate.value ?? minDate.value).getMinutes()
  return Math.floor(m / MINUTE_STEP) * MINUTE_STEP
})

// Выбранный день совпадает с днём нижней границы — тогда часы/минуты ограничены
const isMinDaySelected = computed(() => {
  const d = tempDate.value ?? minDate.value
  return d.getFullYear() === minDate.value.getFullYear()
    && d.getMonth() === minDate.value.getMonth()
    && d.getDate() === minDate.value.getDate()
})

function isDayDisabled(day: number) {
  const d = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), day)
  return d < minDayStart.value
}

function isHourDisabled(h: number) {
  return isMinDaySelected.value && h < minDate.value.getHours()
}

function isMinuteDisabled(m: number) {
  return isMinDaySelected.value
    && selectedHour.value === minDate.value.getHours()
    && m < minDate.value.getMinutes()
}

function clampToMin(d: Date): Date {
  return d < minDate.value ? new Date(minDate.value) : d
}

function selectDay(day: number) {
  if (isDayDisabled(day))
    return
  const base = tempDate.value ?? minDate.value
  const next = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth(),
    day,
    base.getHours(),
    base.getMinutes(),
  )
  tempDate.value = clampToMin(next)
}

function setHour(h: number) {
  const base = tempDate.value ?? new Date(minDate.value)
  const next = new Date(base)
  next.setHours(h)
  tempDate.value = clampToMin(next)
}

function setMinute(m: number) {
  const base = tempDate.value ?? new Date(minDate.value)
  const next = new Date(base)
  next.setMinutes(m)
  tempDate.value = clampToMin(next)
}

function isSelected(day: number) {
  if (!tempDate.value)
    return false
  return tempDate.value.getDate() === day
    && tempDate.value.getMonth() === viewDate.value.getMonth()
    && tempDate.value.getFullYear() === viewDate.value.getFullYear()
}

function prevMonth() {
  if (isPrevDisabled.value)
    return
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

function clear() {
  tempDate.value = null
}

function submit() {
  model.value = tempDate.value
  emit('close')
}

function setQuickDate(type: 'now' | '1h' | '3h' | 'tomorrow') {
  const d = new Date(minDate.value)
  if (type === '1h')
    d.setHours(d.getHours() + 1)
  if (type === '3h')
    d.setHours(d.getHours() + 3)
  if (type === 'tomorrow')
    d.setDate(d.getDate() + 1)

  tempDate.value = clampToMin(d)
  viewDate.value = new Date(d)
}

watch(model, (newVal) => {
  if (newVal) {
    tempDate.value = new Date(newVal)
    viewDate.value = new Date(newVal)
  }
})
</script>

<template>
  <div class="dp-modal">
    <!-- Шапка -->
    <header class="dp-header">
      <button
        class="btn-text text-gray"
        @click="emit('close')"
      >
        Отмена
      </button>
      <span class="dp-title">{{ title || 'Дата начала' }}</span>
      <button
        class="btn-text text-blue"
        @click="submit"
      >
        Готово
      </button>
    </header>

    <!-- Поле ввода -->
    <div class="dp-input-wrapper">
      <div class="dp-input">
        <u-icon
          icon="line-md:calendar"
          class="icon-cal"
          width="20"
          height="20"
        />
        <span class="dp-input-text">{{ displayTempDate }}</span>
        <button
          v-if="tempDate"
          class="btn-clear"
          @click="clear"
        >
          Очистить
        </button>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="dp-quick">
      <button
        class="chip"
        @click="setQuickDate('now')"
      >
        Сейчас
      </button>
      <button
        class="chip"
        @click="setQuickDate('1h')"
      >
        +1 ч
      </button>
      <button
        class="chip"
        @click="setQuickDate('3h')"
      >
        +3 ч
      </button>
      <button
        class="chip"
        @click="setQuickDate('tomorrow')"
      >
        Завтра
      </button>
    </div>

    <!-- Выбор времени -->
    <div class="dp-time">
      <span class="dp-time__label">Время</span>
      <div class="dp-time__controls">
        <select
          class="dp-time__select"
          :value="selectedHour"
          @change="setHour(Number(($event.target as HTMLSelectElement).value))"
        >
          <option
            v-for="h in hours"
            :key="h"
            :value="h"
            :disabled="isHourDisabled(h)"
          >
            {{ String(h).padStart(2, '0') }}
          </option>
        </select>
        <span class="dp-time__colon">:</span>
        <select
          class="dp-time__select"
          :value="selectedMinute"
          @change="setMinute(Number(($event.target as HTMLSelectElement).value))"
        >
          <option
            v-for="m in minutes"
            :key="m"
            :value="m"
            :disabled="isMinuteDisabled(m)"
          >
            {{ String(m).padStart(2, '0') }}
          </option>
        </select>
      </div>
    </div>

    <!-- Навигация месяца -->
    <div class="dp-month-nav">
      <button
        class="nav-btn"
        :disabled="isPrevDisabled"
        @click="prevMonth"
      >
        <u-icon
          icon="fe:arrow-left"
          width="16"
          height="16"
        />
      </button>
      <div class="current-month">
        {{ displayViewMonth }}
        <u-icon
          icon="fe:arrow-down"
          width="14"
          height="14"
          class="chevron"
        />
      </div>
      <button
        class="nav-btn"
        @click="nextMonth"
      >
        <u-icon
          icon="fe:arrow-right"
          width="16"
          height="16"
        />
      </button>
    </div>

    <!-- Сетка календаря -->
    <div class="dp-grid">
      <!-- Дни недели -->
      <div
        v-for="wd in weekDays"
        :key="wd"
        class="weekday"
      >
        {{ wd }}
      </div>

      <!-- Пустые слоты первого месяца -->
      <div
        v-for="i in calendarDays.emptySlots"
        :key="`empty-${i}`"
        class="day empty"
      />

      <!-- Дни -->
      <button
        v-for="day in calendarDays.daysInMonth"
        :key="day"
        class="day"
        :class="{ 'is-selected': isSelected(day), 'is-disabled': isDayDisabled(day) }"
        :disabled="isDayDisabled(day)"
        @click="selectDay(day)"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dp-modal {
  color: var(--text-color);
  width: 100%;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.dp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .dp-title {
    font-weight: 600;
    font-size: 17px;
  }
}

.btn-text {
  background: none;
  border: none;
  font-size: 15px;
  cursor: pointer;
  padding: 0;

  &.text-gray {
    color: var(--text-color-secondary);
  }
  &.text-blue {
    color: var(--primary-color);
    font-weight: 500;
  }
}

.dp-input-wrapper {
  margin-bottom: 16px;
}

.dp-input {
  display: flex;
  align-items: center;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
  border-radius: 12px;
  padding: 12px 16px;

  .icon-cal {
    color: var(--primary-color);
    margin-right: 12px;
  }
  .dp-input-text {
    flex: 1;
    font-size: 16px;
  }

  .btn-clear {
    background: none;
    border: none;
    color: var(--text-color-secondary);
    font-size: 13px;
    cursor: pointer;
  }
}

.dp-quick {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 24px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  .chip {
    white-space: nowrap;
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
    color: var(--text-color);
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s;

    &:hover {
      background: var(--surface-hover);
    }
  }
}

.dp-month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .current-month {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 16px;

    .chevron {
      color: var(--text-color-secondary);
    }
  }

  .nav-btn {
    background: var(--surface-subtle);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }
}

.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  text-align: center;

  .weekday {
    font-size: 11px;
    color: var(--text-color-muted);
    margin-bottom: 12px;
    font-weight: 500;
  }

  .day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 15px;
    cursor: pointer;
    border-radius: 12px;
    transition: 0.2s;

    &.empty {
      pointer-events: none;
    }

    &.is-disabled {
      color: var(--text-color-muted);
      opacity: 0.4;
      pointer-events: none;
    }

    &:hover:not(.is-selected):not(.is-disabled) {
      background: var(--surface-hover);
    }

    &.is-selected {
      background: var(--accent-gradient, linear-gradient(135deg, #4f46e5, #3b82f6));
      box-shadow: 0 4px 20px color-mix(in srgb, var(--primary-color) 40%, transparent);
      font-weight: 600;
    }
  }
}

.dp-time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__colon {
    font-weight: 700;
    color: var(--text-color-secondary);
  }

  &__select {
    appearance: none;
    -webkit-appearance: none;
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
    color: var(--text-color);
    font-size: 16px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    padding: 8px 14px;
    border-radius: 10px;
    cursor: pointer;
    text-align: center;
    text-align-last: center;

    &:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--primary-color) 50%, transparent);
    }
  }
}
</style>
