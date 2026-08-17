import type { App } from 'vue'
import { App as CapacitorApp } from '@capacitor/app'
import { useChatSocket } from '@/components/00.shared/composables/useChatSocket'
import { useWebSocket } from '@/components/00.shared/composables/useWebSocket'
import { useChatsStore } from '@/components/00.shared/stores/chats'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

const MARKS_NAMESPACE = '/marks'

export default {
  install: (_app: App) => {
    const { connect, sockets } = useWebSocket()
    const { connectChats, disconnectChats } = useChatSocket()
    const chatsStore = useChatsStore()

    connect(MARKS_NAMESPACE, { path: '/marks/socket.io' })

    useChatsStore()

    const auth = useAuthStore()

    watch(
      () => auth.token,
      (token) => {
        if (token) {
          connectChats(token)
          chatsStore.initPresence()
        }
        else {
          disconnectChats()
        }
      },
      { immediate: true },
    )

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        sockets.forEach((socketData) => {
          if (!socketData.instance.connected) {
            socketData.instance.connect()
          }
        })
      }
    })
  },
}
