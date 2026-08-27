<script setup lang="ts">
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import UDatePickerModal from './DatePickerModal.vue'

const startAt = defineModel<Date>('startAt', { required: true })
const endAt = defineModel<Date | null>('endAt', { required: true })

const dialogStore = useDialogStore()

const formatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function openStartModal() {
  dialogStore.open(
    UDatePickerModal,
    {
      'modelValue': startAt.value,
      'title': 'Дата начала',
      'onUpdate:modelValue': (newDate: Date | null | undefined) => {
        if (newDate) {
          startAt.value = newDate
        }
      },
      'onClose': () => {
        dialogStore.close()
      },
    },
    {
      headerModal: false,
      position: 'end center',
      transition: 'scale',
    },
  )
}

function openEndModal() {
  dialogStore.open(
    UDatePickerModal,
    {
      'modelValue': endAt.value,
      'title': 'Дата окончания',
      'onUpdate:modelValue': (newDate: Date | null | undefined) => {
        endAt.value = newDate ?? null
      },
      'onClose': () => dialogStore.close(),
    },
    {
      headerModal: false,
      position: 'end center',
      transition: 'scale',
    },
  )
}

const displayStart = computed(() => formatter.format(startAt.value))
const displayEnd = computed(() => (endAt.value ? formatter.format(endAt.value) : '-'))
</script>

<template>
  <div class="u-date-picker">
    <div
      class="u-date-picker__item"
      @click="openStartModal"
    >
      <span class="label-text">
        Начало
      </span>
      <span class="value-text">
        {{ displayStart }}
      </span>
    </div>

    <u-icon
      icon="line-md:arrow-right"
      height="20"
      width="20"
    />

    <div
      class="u-date-picker__item"
      @click="openEndModal"
    >
      <span class="label-text">
        Конец
      </span>
      <span class="value-text">
        {{ displayEnd }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.u-date-picker {
  display: flex;
  align-items: center;
  gap: 10px;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1 1 0%;
    @include glass-panel(12px, 10px 12px, false);
    cursor: pointer;
    transition: 150ms;

    .label-text {
      font-size: 10px;
    }
  }
}
</style>
