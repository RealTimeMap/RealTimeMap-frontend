<script lang="ts" setup>
const { count, max = 99 } = defineProps<{
  count: number
  max?: number
}>()

const label = computed(() =>
  count > max ? `${max}+` : String(count),
)
</script>

<template>
  <span
    v-if="count > 0"
    class="u-badge"
  >
    {{ label }}
  </span>
</template>

<style lang="scss" scoped>
.u-badge {
  display: inline-block;
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  color: #fff;
  background: var(--primary-color);
}
</style>
