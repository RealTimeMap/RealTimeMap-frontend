<script setup lang="ts">
import { useAuthStore } from '@/components/00.shared/stores/auth'
import ProfileUserView from './index.vue'

const emit = defineEmits<{
  (e: 'done'): void
}>()

const { user } = storeToRefs(useAuthStore())

onMounted(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => emit('done')))
})
</script>

<template>
  <div
    class="profile-warmup"
    aria-hidden="true"
    inert
  >
    <profile-user-view
      :user="user"
      is-own
    />
  </div>
</template>

<style lang="scss" scoped>
.profile-warmup {
  position: fixed;
  top: 0;
  left: -200vw;
  width: 100vw;
  pointer-events: none;
  contain: layout paint style;
}
</style>
