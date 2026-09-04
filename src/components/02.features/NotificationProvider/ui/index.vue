<script setup lang="ts">
import { useNotificationStore } from '@/components/00.shared/stores/notification'

const store = useNotificationStore()
</script>

<template>
  <teleport to="body">
    <div class="notifications-container">
      <transition-group name="list">
        <u-notification-item
          v-for="n in store.notifications"
          :key="n.id"
          :item="n"
          @close="store.remove(n.id)"
        />
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.notifications-container {
  position: fixed;
  top: calc(12px + var(--safe-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.list-enter-active {
  transition: all 0.38s cubic-bezier(0.25, 1, 0.5, 1);
}
.list-leave-active {
  transition: opacity 0.25s ease;
}
.list-move {
  transition: transform 0.36s cubic-bezier(0.25, 1, 0.5, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-24px) scale(0.96);
}

.list-leave-to {
  opacity: 0;
}
</style>
