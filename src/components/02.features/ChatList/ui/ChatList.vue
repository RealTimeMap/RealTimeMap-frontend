<script lang="ts" setup>
import { useChatList } from '../model/useChatList.ts'
import ChatListItem from './ChatListItem.vue'

const { chats } = useChatList()
</script>

<template>
  <div class="chats-container">
    <h1>Чаты</h1>
    <div class="">
      <chat-list-item
        v-for="chat in chats"
        :key="chat.chatId"
        :chat="chat"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chats-container {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 400px;
  margin: 0 auto;
  width: 90%;
  padding-top: calc(16px + var(--safe-top));
  padding-bottom: calc(110px + var(--safe-bottom));
}
</style>
