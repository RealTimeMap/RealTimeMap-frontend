import type {
  Chat,
  ChatReadPayload,
  Message,
  PresenceSnapshotPayload,
  PresenceUserPayload,
} from '@/components/00.shared/services/chats/index.type'
import { defineStore } from 'pinia'
import { useChatSocket } from '@/components/00.shared/composables/useChatSocket'
import { chatApi } from '@/components/00.shared/services/chats'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

export const useChatsStore = defineStore('chats', () => {
  const chats = shallowRef<Chat[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const onlineUserIds = ref(new Set<number>())
  const lastSeenAt = ref(new Map<number, string>())
  const activeChatId = ref<number | null>(null)

  const router = useRouter()

  const isPeerOnline = (userId?: number) =>
    userId != null && onlineUserIds.value.has(userId)

  const getLastSeenAt = (userId?: number) =>
    userId != null ? lastSeenAt.value.get(userId) : undefined

  const applySnapshot = (payload: PresenceSnapshotPayload) => {
    onlineUserIds.value = new Set(payload.online)
  }

  const applyOnline = (payload: PresenceUserPayload) => {
    if (onlineUserIds.value.has(payload.userId))
      return
    onlineUserIds.value = new Set(onlineUserIds.value).add(payload.userId)
  }

  const applyOffline = (payload: PresenceUserPayload) => {
    if (onlineUserIds.value.has(payload.userId)) {
      const next = new Set(onlineUserIds.value)
      next.delete(payload.userId)
      onlineUserIds.value = next
    }

    lastSeenAt.value = new Map(lastSeenAt.value).set(payload.userId, payload.at)
  }

  const unreadTotal = computed(() =>
    chats.value.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
  )

  async function fetchChats() {
    isLoading.value = true
    error.value = null

    try {
      chats.value = await chatApi.getAllChats()
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Не удалось загрузить чаты')
      console.error('[Chats] Ошибка загрузки списка:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  function setActiveChat(chatId: number | null) {
    activeChatId.value = chatId

    if (chatId !== null)
      markAsRead(chatId)
  }

  function markAsRead(chatId: number) {
    chats.value = chats.value.map(chat =>
      chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat,
    )
  }

  function applyIncoming(message: Message) {
    const target = chats.value.find(chat => chat.chatId === message.chatId)

    if (!target) {
      fetchChats()
      return
    }

    const isActive = message.chatId === activeChatId.value

    const updated: Chat = {
      ...target,
      updatedAt: message.createdAt,
      unreadCount: isActive ? 0 : target.unreadCount + 1,
      lastMessage: {
        messageId: message.id,
        username: message.sender.username,
        content: message.content,
      },
    }

    chats.value = [
      updated,
      ...chats.value.filter(chat => chat.chatId !== message.chatId),
    ]
  }

  async function newChat(peerId: number) {
    try {
      const direct = await chatApi.postChatDirect(peerId)

      if (!chats.value.some(chat => chat.chatId === direct.chatId)) {
        chats.value = [
          {
            chatId: direct.chatId,
            type: 'direct',
            title: direct.peer.username,
            avatar: direct.peer.avatar,
            unreadCount: 0,
            updatedAt: direct.createdAt,
            peerId,
          },
          ...chats.value,
        ]
      }
      router.push({ name: 'chat-room', params: { chatId: direct.chatId } })
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('Не удалось создать чат')
      console.error('[Chats] Ошибка создания чата:', err)
    }
  }

  /**
   * Чат прочитан с другого устройства текущего пользователя —
   * синхронно гасим счётчик. Чужие прочтения к unread не относятся:
   * их обрабатывает useChatMessages ради галочек.
   */
  function applyRead(payload: ChatReadPayload) {
    if (payload.userId !== useAuthStore().user?.userId)
      return

    markAsRead(payload.chatId)
  }

  const { isConnected, onChatMessage, onChatRead } = useChatSocket()
  let unsubscribers: (() => void)[] = []

  const unsubscribeAll = () => {
    unsubscribers.forEach(off => off())
    unsubscribers = []
  }

  watch(isConnected, (connected) => {
    unsubscribeAll()

    if (!connected)
      return

    unsubscribers = [
      onChatMessage(applyIncoming),
      onChatRead(applyRead),
    ]

    fetchChats()
  }, { immediate: true })

  let presenceUnsubscribers: (() => void)[] = []
  let isPresenceSubscribed = false

  const initPresence = () => {
    if (isPresenceSubscribed)
      return
    isPresenceSubscribed = true

    const {
      isConnected,
      onPresenceSnapshot,
      onPresenceOnline,
      onPresenceOffline,
    } = useChatSocket()

    watch(
      isConnected,
      (connected) => {
        presenceUnsubscribers.forEach(off => off())
        presenceUnsubscribers = []

        if (!connected) {
          onlineUserIds.value = new Set()
          return
        }

        presenceUnsubscribers = [
          onPresenceSnapshot(applySnapshot),
          onPresenceOnline(applyOnline),
          onPresenceOffline(applyOffline),
        ]
      },
      { immediate: true },
    )
  }

  return {
    chats,
    isLoading,
    error,
    activeChatId,
    unreadTotal,
    onlineUserIds,

    newChat,
    fetchChats,
    setActiveChat,
    markAsRead,
    applyIncoming,
    isPeerOnline,
    initPresence,
    getLastSeenAt,
  }
})
