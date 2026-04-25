<script setup lang="ts">
defineProps<{
  label: string
  placeholder: string
}>()
const model = defineModel<string>()
</script>

<template>
  <div class="u-textarea u-block">
    <label class="u-textarea__label label-text">
      {{ label }}
    </label>

    <textarea
      v-model="model"
      rows="4"
      class="u-textarea__field value-text"
      :placeholder="placeholder"
    />
  </div>
</template>

<style scoped lang="scss">
.u-textarea {
  position: relative;
  width: 100%;
  max-width: 400px;
  align-items: flex-start;
  gap: 0;
  flex-direction: column;

  &__field {
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-family: inherit;
    padding: 0;
    min-height: 80px;
    width: 100%;

    &::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
  }
}
</style>
