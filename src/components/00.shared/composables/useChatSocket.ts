import type { ChatReadPayload, ChatTypingPayload, Message, PresenceSnapshotPayload, PresenceUserPayload, TypingPayload } from '@/components/00.shared/services/chats/index.type'
import { useWebSocket } from './useWebSocket'

export const CHATS_NAMESPACE = '/chats'

export function useChatSocket() {
  const {
    connect,
    disconnect,
    on,
    emit,
    getSocketState,
  } = useWebSocket()

  const isConnected = computed(() => getSocketState(CHATS_NAMESPACE)?.isConnected ?? false)

  const connectChats = (token: string) => {
    connect(CHATS_NAMESPACE, {
      transports: ['polling'],
      withCredentials: true,
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
    })
  }

  const disconnectChats = () => disconnect(CHATS_NAMESPACE)

  // --- Server -> Client ---
  const onChatMessage = (handler: (message: Message) => void) =>
    on(CHATS_NAMESPACE, 'message.new', handler)

  const onChatRead = (handler: (payload: ChatReadPayload) => void) =>
    on(CHATS_NAMESPACE, 'chat.read', handler)

  const onPresenceSnapshot = (handler: (payload: PresenceSnapshotPayload) => void) =>
    on(CHATS_NAMESPACE, 'presence.snapshot', handler)

  const onPresenceOnline = (handler: (payload: PresenceUserPayload) => void) =>
    on(CHATS_NAMESPACE, 'presence.online', handler)

  const onPresenceOffline = (handler: (payload: PresenceUserPayload) => void) =>
    on(CHATS_NAMESPACE, 'presence.offline', handler)

  const onChatTyping = (handler: (payload: ChatTypingPayload) => void) =>
    on(CHATS_NAMESPACE, 'chat.typing', handler)

  // --- Client -> Server ---
  const startTyping = (payload: TypingPayload) =>
    emit(CHATS_NAMESPACE, 'typing.start', payload)

  const stopTyping = (payload: TypingPayload) =>
    emit(CHATS_NAMESPACE, 'typing.stop', payload)

  return {
    isConnected,
    connectChats,
    disconnectChats,

    onChatMessage,
    onChatRead,
    onPresenceSnapshot,
    onPresenceOnline,
    onPresenceOffline,
    onChatTyping,

    startTyping,
    stopTyping,
  }
}
