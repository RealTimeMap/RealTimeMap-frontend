<template>
  <router-view v-slot="{ Component }">
    <transition
      name="chat-slide"
      mode="out-in"
    >
      <keep-alive include="ChatListPage">
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<style lang="scss" scoped>
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.chat-slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.chat-slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
