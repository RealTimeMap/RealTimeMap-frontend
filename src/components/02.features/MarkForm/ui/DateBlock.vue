<script setup lang="ts">
const startAt = defineModel<Date>('startAt', { required: true })
const endAt = defineModel<Date | null>('endAt', { required: true })
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
      />
    </div>

    <span class="date-block__note">
      Оставьте «Конец» пустым, если это разовый момент</span>
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
    color: rgba(255, 255, 255, 0.4);
    margin-top: 8px;
    line-height: 1.4;
  }
}
</style>
