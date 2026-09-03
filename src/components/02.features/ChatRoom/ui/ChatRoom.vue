<script lang="ts" setup>
import { useViewportHeight } from '@/components/00.shared/composables/useViewportHeight'
import { formatLastSeen } from '@/components/00.shared/lib/lastSeen/index.ts'
import { useChatsStore } from '@/components/00.shared/stores/chats'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import { useChatMessages } from '../model/useChatMessages'
import { useChatTyping } from '../model/useChatTyping.ts'
import ChatComposer from './ChatComposer.vue'
import ChatRoomHeader from './ChatRoomHeader.vue'
import MessageFeed from './MessageFeed.vue'

const props = defineProps<{
  chatId: number
}>()

const router = useRouter()
const auth = useAuthStore()
const chatsStore = useChatsStore()

useViewportHeight()

const {
  messages,
  isLoading,
  isSending,
  error,
  hasMore,
  isLoadingMore,
  peerLastReadId,
  sendMessage,
  retryMessage,
  loadMore,
} = useChatMessages(
  toRef(props, 'chatId'),
)
const { typingUsers, notifyTyping, notifyStopped } = useChatTyping(
  toRef(props, 'chatId'),
)

const chatInfo = computed(() =>
  chatsStore.chats.find(chat => chat.chatId === props.chatId),
)

const peer = computed(() => {
  const currentUserId = auth.user?.userId
  return messages.value.find(message => message.sender.id !== currentUserId)?.sender
})

const peerId = computed(() => chatInfo.value?.peerId ?? peer.value?.id)

const title = computed(() => chatInfo.value?.title || peer.value?.username || 'Чат')
const avatar = computed(() => chatInfo.value?.avatar || peer.value?.avatar || undefined)
const isPeerOnline = computed(() => chatsStore.isPeerOnline(peerId.value))
const isPeerTyping = computed(() => typingUsers.value.length > 0)

const peerStatusText = computed(() => {
  if (isPeerTyping.value)
    return 'печатает...'
  if (isPeerOnline.value)
    return 'в сети'
  return formatLastSeen(chatsStore.getLastSeenAt(peerId.value))
})

function goBack() {
  router.push({ name: 'chats' })
}

async function onSend(text: string) {
  notifyStopped()
  await sendMessage(text)
}
</script>

<template>
  <div class="chat-room">
    <chat-room-header
      :title="title"
      :avatar="avatar"
      :user-id="peerId"
      :is-online="isPeerOnline"
      :status-text="peerStatusText"
      :is-typing="isPeerTyping"
      @back="goBack"
    />

    <message-feed
      :messages="messages"
      :is-loading="isLoading"
      :has-more="hasMore"
      :is-loading-more="isLoadingMore"
      :peer-last-read-id="peerLastReadId"
      :is-peer-typing="isPeerTyping"
      @load-more="loadMore"
      @retry="retryMessage"
    />

    <span
      v-if="error"
      class="chat-room__error"
    >
      {{ error.message }}
    </span>

    <chat-composer
      :is-sending="isSending"
      @send="onSend"
      @typing="notifyTyping"
      @stop-typing="notifyStopped"
    />
  </div>
</template>

<style lang="scss" scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: var(--viewport-height, 100dvh);

  max-width: 400px;
  margin: 0 auto;
  width: 100%;

  &__error {
    margin: 0 16px 6px;
    font-size: 13px;
    color: var(--red-color);
    text-align: center;
  }
}
</style>
