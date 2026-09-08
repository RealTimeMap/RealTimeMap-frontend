<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import ChatList from '@/components/02.features/ChatList'

const route = useRoute()
const isDesktop = useMediaQuery('(min-width: 900px)')
</script>

<template>
  <div
    class="chats"
    :class="{ 'chats--desktop': isDesktop }"
  >
    <aside
      v-if="isDesktop"
      class="chats__list"
    >
      <chat-list />
    </aside>

    <section class="chats__detail">
      <template v-if="isDesktop">
        <router-view
          v-if="route.name === 'chat-room'"
          v-slot="{ Component }"
        >
          <transition
            name="chat-fade"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
        <div
          v-else
          class="chats__empty"
        >
          <u-icon
            icon="line-md:chat-bubble"
            height="40"
          />
          <span>Выберите чат, чтобы начать переписку</span>
        </div>
      </template>

      <router-view
        v-else
        v-slot="{ Component }"
      >
        <transition
          name="chat-slide"
          mode="out-in"
        >
          <keep-alive include="ChatListPage">
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.chats {
  height: 100%;
}

.chats__detail {
  height: 100%;
  min-width: 0;
  position: relative;
}

.chats--desktop {
  display: flex;
  height: 100%;
  padding-left: 132px;

  .chats__list {
    flex-shrink: 0;
    width: 380px;
    height: 100%;
    overflow: hidden;
    border-right: 1px solid var(--border-subtle);

    :deep(.chats-container) {
      width: 100%;
      max-width: none;
      padding: 0 12px calc(20px + var(--safe-bottom));
    }
  }

  .chats__detail {
    flex: 1;

    :deep(.chat-room) {
      max-width: none;
    }
  }
}

.chats__empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-color-secondary);
  text-align: center;
  padding: 24px;

  span {
    @include value-text(15px, var(--text-color-secondary), 500);
  }
}

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

.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: opacity 0.18s ease;
}

.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
}
</style>
