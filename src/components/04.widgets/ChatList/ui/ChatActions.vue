<script setup lang="ts">
import type { Chat } from '@/components/00.shared/services/chats/index.type'
import { useChatsStore } from '@/components/00.shared/stores/chats'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

const props = defineProps<{
  chat: Chat
}>()

const chatsStore = useChatsStore()
const notify = useNotificationStore()
const { close } = useDialogStore()

const isDirect = computed(() => props.chat.type === 'direct')
const forEveryone = ref(false)

async function remove(forEveryone: boolean) {
  close()
  if (!await chatsStore.deleteChat(props.chat.chatId, forEveryone)) {
    notify.add({
      title: 'Не удалось удалить чат',
      description: 'Проверьте интернет и попробуйте ещё раз',
      type: 'error',
    })
  }
}
</script>

<template>
  <div class="chat-actions">
    <p class="chat-actions__title">
      {{ chat.title }}
    </p>

    <p class="chat-actions__question">
      Вы точно хотите удалить чат?
    </p>
    <label
      v-if="isDirect"
      class="chat-actions__option"
    >
      <input
        v-model="forEveryone"
        class="chat-actions__check"
        type="checkbox"
      >
      <span>Удалить у меня и у {{ chat.title }}</span>
    </label>
    <div class="chat-actions__buttons">
      <button
        class="chat-actions__button"
        type="button"
        @click="close"
      >
        Отмена
      </button>
      <button
        class="chat-actions__button chat-actions__button--danger"
        type="button"
        @click="remove(forEveryone)"
      >
        Удалить
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;

  &__title {
    margin: 0 0 6px;
    text-align: center;
    @include value-text(16px, var(--text-color), 700);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__question {
    margin: 0 0 4px;
    text-align: center;
    @include value-text(15px, var(--text-color), 500);
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-block: 10px;
    @include value-text(15px, var(--text-color), 500);
    cursor: pointer;
  }

  &__check {
    flex-shrink: 0;
    appearance: none;
    width: 20px;
    height: 20px;
    margin: 0;
    border: 1.5px solid var(--text-color-muted);
    border-radius: 6px;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;

    &::after {
      content: '';
      width: 6px;
      height: 11px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      transform: translateY(-1px) rotate(45deg) scale(0);
      transition: transform 0.15s ease;
    }

    &:checked {
      background: var(--primary-color);
      border-color: var(--primary-color);

      &::after {
        transform: translateY(-1px) rotate(45deg) scale(1);
      }
    }
  }

  &__buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
  }

  &__button {
    height: 50px;
    border: none;
    border-radius: 14px;
    background: var(--surface-subtle);
    @include value-text(15px, var(--text-color), 600);
    cursor: pointer;

    &:active {
      transform: scale(0.98);
    }

    &--danger {
      background: var(--red-color);
      color: #fff;
    }
  }
}
</style>
