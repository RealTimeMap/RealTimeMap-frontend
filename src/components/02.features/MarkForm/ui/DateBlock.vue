<script setup lang="ts">
const props = defineProps<{
  endRequired?: boolean
  endError?: boolean
}>()

const startAt = defineModel<Date>('startAt', { required: true })
const endAt = defineModel<Date | null>('endAt', { required: true })

const DAY_MS = 24 * 60 * 60 * 1000

const startMin = computed(() => new Date(Date.now() - 7 * DAY_MS))
const startMax = computed(() => new Date(Date.now() + 3 * DAY_MS))

const endMin = computed(() => new Date(Math.max(startAt.value.getTime(), Date.now())))
const endMax = computed(() => new Date(Date.now() + 7 * DAY_MS))
</script>

<template>
  <div class="u-block date-block">
    <div class="date-block__header">
      <u-icon
        class=""
        icon="line-md:calendar"
        width="16"
        height="16"
      />
      <span class="label-text">Период события</span>
    </div>

    <div class="date-block__body">
      <u-date-picker
        v-model:start-at="startAt"
        v-model:end-at="endAt"
        :start-min="startMin"
        :start-max="startMax"
        :end-min="endMin"
        :end-max="endMax"
        :end-required="props.endRequired"
        :end-error="props.endError"
      />
    </div>

    <span
      class="date-block__note"
      :class="{ 'date-block__note--error': props.endError }"
    >
      {{ props.endRequired
        ? 'Событие в прошлом — укажите дату окончания'
        : 'Оставьте «Конец» пустым, если это разовый момент' }}</span>
  </div>
</template>

<style lang="scss" scoped>
.date-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;

  &__header {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  &__body {
    width: 100%;
  }

  &__note {
    font-size: 11px;
    color: var(--text-color-secondary);
    margin-top: 8px;
    line-height: 1.4;

    &--error {
      color: var(--red-color);
    }
  }
}
</style>
