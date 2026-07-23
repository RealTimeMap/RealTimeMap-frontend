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
  top: calc(20px + var(--safe-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-enter-active,
.list-leave-active,
.list-move {
  transition: all 0.4s cubic-bezier(0.3, 1.25, 0.3, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
