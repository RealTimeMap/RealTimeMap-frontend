import type { Ref } from 'vue'
import type { Message } from '@/components/00.shared/services/chats/index.type'
import { useChatSocket } from '@/components/00.shared/composables/useChatSocket'
import { chatApi } from '@/components/00.shared/services/chats'
import { useChatsStore } from '@/components/00.shared/stores/chats'

function toChronological(list: Message[]): Message[] {
  return [...list].sort((a, b) => {
    const byTime = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return byTime !== 0 ? byTime : a.id - b.id
  })
}

export function useChatMessages(chatId: Ref<number>) {
  const messages = shallowRef<Message[]>([])
  const isLoading = ref(true)
  const isSending = ref(false)
  const error = ref<Error | null>(null)

  const fetchMessages = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await chatApi.getHistoryChat(chatId.value)
      messages.value = toChronological(response.messages)
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Не удалось загрузить сообщения')
      console.error('[ChatRoom] Ошибка загрузки истории:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  const sendMessage = async (content: string) => {
    const text = content.trim()
    if (!text || isSending.value)
      return

    isSending.value = true

    try {
      const message = await chatApi.postMessage(chatId.value, text)
      messages.value = [...messages.value, message]
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Сообщение не отправлено')
      console.error('[ChatRoom] Ошибка отправки:', err)
    }
    finally {
      isSending.value = false
    }
  }

  const { isConnected, onChatMessage } = useChatSocket()

  const handleIncoming = (message: Message) => {
    if (message.chatId !== chatId.value)
      return
    if (messages.value.some(existing => existing.id === message.id))
      return

    messages.value = [...messages.value, message]
  }

  let unsubscribe: (() => void) | null = null

  watch(
    isConnected,
    (connected, wasConnected) => {
      if (!connected)
        return

      unsubscribe?.()
      unsubscribe = onChatMessage(handleIncoming)

      if (wasConnected === false)
        fetchMessages()
    },
    { immediate: true },
  )

  const chatsStore = useChatsStore()

  watch(
    chatId,
    (id) => {
      fetchMessages()
      chatsStore.setActiveChat(id)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    unsubscribe?.()
    chatsStore.setActiveChat(null)
  })

  return {
    messages,
    isLoading,
    isSending,
    error,
    fetchMessages,
    sendMessage,
  }
}
