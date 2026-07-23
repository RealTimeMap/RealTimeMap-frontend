import type { Message } from '@/components/00.shared/services/chats/index.type'
import { useWebSocket } from './useWebSocket'

export const CHATS_NAMESPACE = '/chats'

export function useChatSocket() {
  const { connect, disconnect, on, getSocketState } = useWebSocket()

  const isConnected = computed(() => getSocketState(CHATS_NAMESPACE)?.isConnected ?? false)

  const connectChats = (token: string) => {
    connect(CHATS_NAMESPACE, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      extraHeaders: { Authorization: `Bearer ${token}` },
    })
  }

  const disconnectChats = () => disconnect(CHATS_NAMESPACE)

  const onChatMessage = (handler: (message: Message) => void) =>
    on(CHATS_NAMESPACE, 'message.new', handler)

  return {
    isConnected,
    connectChats,
    disconnectChats,
    onChatMessage,
  }
}
