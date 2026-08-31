<script lang="ts" setup>
import { useChatList } from '../model/useChatList.ts'
import ChatListItem from './ChatListItem.vue'

const { chats } = useChatList()
</script>

<template>
  <div class="chats-container">
    <h1 class="chats-header">
      Чаты
    </h1>
    <template v-if="chats.length > 0">
      <chat-list-item
        v-for="chat in chats"
        :key="chat.chatId"
        :chat="chat"
      />
    </template>
    <template v-else>
      <div class="chats-empty">
        <div class="icon">
          <u-icon
            width="34"
            icon="line-md:chat-bubble"
          />
        </div>
        <div class="chats-content">
          <h2>Пока нет переписок</h2>
          <p>Откройте метку на карте и напишите её автору или воспользуйтесь поиском.</p>
        </div>
        <router-link
          class="button"
          to="/"
        >
          Найти людей на карте
        </router-link>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.chats-container {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 400px;
  margin: 0 auto;
  height: 100%;
  width: 90%;
  padding-top: calc(16px + var(--safe-top));
  padding-bottom: calc(110px + var(--safe-bottom));
}

.chats-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 300px;
  margin: 0 auto;
  justify-content: center;
  margin-top: 150px;
  gap: 20px;

  .icon {
    width: max-content;
    width: 78px;
    height: 78px;
    border-radius: 26px;
    background: linear-gradient(135deg, rgba(59, 157, 230, 0.22), rgba(140, 107, 255, 0.22));
    border: 1px solid rgba(140, 107, 255, 0.28);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(169, 140, 255);
  }

  .chats-content {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h2 {
      @include value-text(20px, rgb(242, 243, 246), 700);
    }
    p {
      @include label-text(14px, none);
      font-weight: 400;
    }
  }

  .button {
    border-radius: 15px;
    padding: 13px 22px;
    @include gradient();
    @include value-text(14px, #fff, 700);
  }
}
</style>
