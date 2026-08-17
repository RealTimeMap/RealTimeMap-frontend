<script lang="ts" setup>
import type { Chat } from '@/components/00.shared/services/chats/index.type'
import { formatChatTimestamp } from '@/components/00.shared/lib/date/FormatDate'
import { useChatsStore } from '@/components/00.shared/stores/chats'

const props = defineProps<{
  chat: Chat
}>()

const chatsStore = useChatsStore()

const isOnline = computed(() => chatsStore.isPeerOnline(props.chat.peerId))
</script>

<template>
  <router-link
    class="chat"
    :to="{
      name: 'chat-room',
      params: {
        chatId: chat.chatId,
      },
    }"
  >
    <div class="chat-avatar">
      <u-avatar
        :size="52"
        rounded
        :src="chat.avatar || undefined"
        :alt-text="chat.title"
      />
      <span
        v-if="isOnline"
        class="chat-avatar__dot"
      />
    </div>
    <div class="chat-content">
      <span class="name">{{ chat.title }}</span>
      <span class="content">{{ chat.lastMessage?.content }}</span>
    </div>
    <div class="chat-info">
      <span class="time">{{ formatChatTimestamp(chat.updatedAt) }}</span>
      <u-badge :count="chat.unreadCount" />
    </div>
  </router-link>
</template>

<style lang="scss" scoped>
.chat {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 12px 2px;
  cursor: pointer;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: inherit;

  &-avatar {
    position: relative;
    flex-shrink: 0;
    line-height: 0;

    &__dot {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--access-color);
      border: 2px solid #0b0b10;
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;

    .name,
    .content {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .name {
      font-weight: 600;
      font-size: 16px;
    }
    .content {
      @include label-text(14px, none);
    }
  }

  &-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    margin-left: auto;
    flex-shrink: 0;

    .time {
      @include label-text(12px, none);
      white-space: nowrap;
    }
  }
}
</style>
