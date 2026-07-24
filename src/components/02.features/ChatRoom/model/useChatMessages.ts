import type { Ref } from 'vue'
import type { ChatMessage, ChatReadPayload, Message } from '@/components/00.shared/services/chats/index.type'
import { Preferences } from '@capacitor/preferences'
import { useDocumentVisibility, useThrottleFn } from '@vueuse/core'
import { useChatSocket } from '@/components/00.shared/composables/useChatSocket'
import { chatApi } from '@/components/00.shared/services/chats'
import { useChatsStore } from '@/components/00.shared/stores/chats'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

/** Контракт бэкенда: отметку прочтения слать не чаще раза в 1–2 секунды */
const READ_THROTTLE_MS = 1500

const PEER_READ_CACHE_PREFIX = 'chat_peer_read_'

function toChronological(list: ChatMessage[]): ChatMessage[] {
  return [...list].sort((a, b) => {
    const byTime = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return byTime !== 0 ? byTime : a.id - b.id
  })
}

export function useChatMessages(chatId: Ref<number>) {
  const messages = shallowRef<ChatMessage[]>([])

  const isLoadingMore = ref(false)
  const hasMore = ref(true)

  const isLoading = ref(true)
  const isSending = ref(false)
  const error = ref<Error | null>(null)

  /** Курсор прочтения собеседника — по нему рисуются двойные точки */
  const peerLastReadId = ref(0)

  const authStore = useAuthStore()
  const chatsStore = useChatsStore()
  const visibility = useDocumentVisibility()

  // --- КУРСОР ПРОЧТЕНИЯ СОБЕСЕДНИКА ---

  const peerReadCacheKey = (id: number) => `${PEER_READ_CACHE_PREFIX}${id}`

  /**
   * Курсор монотонный, назад не откатываем.
   * Кэшируем локально, потому что сервер отдаёт его только событием `chat.read` —
   * без кэша при перезаходе в чат все свои сообщения снова выглядели бы
   * непрочитанными. Когда бэк начнёт возвращать курсор в истории,
   * кэш останется как фолбэк для офлайна.
   */
  const applyPeerRead = (id: number, lastReadMessageId: number) => {
    if (!lastReadMessageId || lastReadMessageId <= peerLastReadId.value)
      return

    peerLastReadId.value = lastReadMessageId

    Preferences.set({
      key: peerReadCacheKey(id),
      value: String(lastReadMessageId),
    }).catch(err => console.error('[ChatRoom] Не удалось сохранить курсор прочтения:', err))
  }

  const restorePeerRead = async (id: number) => {
    try {
      const { value } = await Preferences.get({ key: peerReadCacheKey(id) })
      const cached = Number(value)

      // пока читали хранилище, пользователь мог уйти в другой чат
      if (id === chatId.value && cached > peerLastReadId.value)
        peerLastReadId.value = cached
    }
    catch (err) {
      console.error('[ChatRoom] Не удалось прочитать курсор прочтения:', err)
    }
  }

  // --- ОТМЕТКА ПРОЧТЕНИЯ ---

  const sendRead = useThrottleFn(
    () => chatApi.postReadChat(chatId.value).catch((err) => {
      console.error('[ChatRoom] Ошибка отметки прочтения:', err)
    }),
    READ_THROTTLE_MS,
    true,
  )

  /** Пока вкладка скрыта, пришедшие сообщения прочитанными не считаются */
  let missedWhileHidden = false

  const markRead = () => {
    if (visibility.value !== 'visible')
      return

    sendRead()
  }

  watch(visibility, (state) => {
    if (state !== 'visible' || !missedWhileHidden)
      return

    missedWhileHidden = false
    markRead()
  })

  // --- ЗАГРУЗКА ---

  const fetchMessages = async () => {
    isLoading.value = true
    error.value = null
    hasMore.value = true

    try {
      const response = await chatApi.getHistoryChat(chatId.value)
      messages.value = toChronological(response.messages)

      // когда бэк начнёт отдавать курсор собеседника в истории, здесь
      // достаточно будет заменить кэш на ответ:
      // applyPeerRead(chatId.value, response.peerLastReadMessageId)

      if (messages.value.length)
        markRead()
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Не удалось загрузить сообщения')
      console.error('[ChatRoom] Ошибка загрузки истории:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  const loadMore = async () => {
    if (isLoadingMore.value || isLoading.value || !hasMore.value)
      return

    const cursor = messages.value[0]?.id
    if (!cursor)
      return

    isLoadingMore.value = true

    try {
      const response = await chatApi.getHistoryChat(chatId.value, {
        lastMessageId: cursor,
      })

      const known = new Set(messages.value.map(m => m.id))
      const older = toChronological(response.messages).filter(m => !known.has(m.id))

      if (!older.length) {
        hasMore.value = false
        return
      }

      messages.value = [...older, ...messages.value]
    }
    catch (err) {
      console.error('[ChatRoom] Ошибка загрузки более ранних сообщений:', err)
    }
    finally {
      isLoadingMore.value = false
    }
  }

  // --- ОТПРАВКА ---
  const replaceByClientId = (clientMessageId: string, next: ChatMessage) => {
    const index = messages.value.findIndex(m => m.clientMessageId === clientMessageId)
    if (index === -1)
      return

    const list = [...messages.value]
    list[index] = next
    messages.value = list
  }

  const patchStatus = (clientMessageId: string, status: ChatMessage['status']) => {
    const current = messages.value.find(m => m.clientMessageId === clientMessageId)
    if (current)
      replaceByClientId(clientMessageId, { ...current, status })
  }

  /**
   * Отправляет уже лежащий в ленте оптимистичный пузырь.
   * Ключ идемпотентности переиспользуется, поэтому ретрай не создаёт дубль
   * даже если предыдущая попытка дошла до сервера, а ответ потерялся.
   */
  const deliver = async (message: ChatMessage) => {
    const clientMessageId = message.clientMessageId
    if (!clientMessageId)
      return

    patchStatus(clientMessageId, 'sending')
    isSending.value = true

    try {
      const saved = await chatApi.postMessage(chatId.value, {
        content: message.content,
        clientMessageId,
      })

      replaceByClientId(clientMessageId, { ...saved, status: 'sent' })
    }
    catch (err) {
      patchStatus(clientMessageId, 'failed')
      error.value = err instanceof Error ? err : new Error('Сообщение не отправлено')
      console.error('[ChatRoom] Ошибка отправки:', err)
    }
    finally {
      isSending.value = false
    }
  }

  const sendMessage = async (content: string) => {
    const text = content.trim()
    const author = authStore.user
    if (!text || !author)
      return

    const optimistic: ChatMessage = {
      // временный отрицательный id: не столкнётся с серверными
      // и не собьёт сортировку по времени
      id: -Date.now(),
      type: 'text',
      content: text,
      clientMessageId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      chatId: chatId.value,
      sender: {
        id: author.userId,
        username: author.username,
        avatar: author.avatar,
      },
      status: 'sending',
    }

    messages.value = [...messages.value, optimistic]

    await deliver(optimistic)
  }

  const retryMessage = async (clientMessageId: string) => {
    const failed = messages.value.find(
      m => m.clientMessageId === clientMessageId && m.status === 'failed',
    )

    if (failed)
      await deliver(failed)
  }

  // --- REALTIME ---

  const { isConnected, onChatMessage, onChatRead } = useChatSocket()

  const handleIncoming = (message: Message) => {
    if (message.chatId !== chatId.value)
      return

    if (messages.value.some(existing => existing.id === message.id))
      return

    // своё сообщение может вернуться по сокету раньше HTTP-ответа:
    // подменяем оптимистичный пузырь, а не добавляем второй
    if (message.clientMessageId) {
      const local = messages.value.find(
        m => m.clientMessageId === message.clientMessageId,
      )

      if (local) {
        replaceByClientId(message.clientMessageId, { ...message, status: 'sent' })
        return
      }
    }

    messages.value = [...messages.value, message]

    if (message.sender.id === authStore.user?.userId)
      return

    if (visibility.value === 'visible')
      markRead()
    else
      missedWhileHidden = true
  }

  const handleRead = (payload: ChatReadPayload) => {
    if (payload.chatId !== chatId.value)
      return

    // своё прочтение с другого устройства обрабатывает стор чатов
    if (payload.userId === authStore.user?.userId)
      return

    applyPeerRead(payload.chatId, payload.lastReadMessageId)
  }

  let unsubscribers: (() => void)[] = []

  const unsubscribeAll = () => {
    unsubscribers.forEach(off => off())
    unsubscribers = []
  }

  watch(
    isConnected,
    (connected, wasConnected) => {
      if (!connected)
        return

      unsubscribeAll()
      unsubscribers = [
        onChatMessage(handleIncoming),
        onChatRead(handleRead),
      ]

      if (wasConnected === false)
        fetchMessages()
    },
    { immediate: true },
  )

  watch(
    chatId,
    (id) => {
      peerLastReadId.value = 0
      missedWhileHidden = false

      restorePeerRead(id)
      fetchMessages()
      chatsStore.setActiveChat(id)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    unsubscribeAll()
    chatsStore.setActiveChat(null)
  })

  return {
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    isLoadingMore,
    peerLastReadId,
    fetchMessages,
    sendMessage,
    retryMessage,
    loadMore,
  }
}
