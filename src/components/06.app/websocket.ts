import type { App } from 'vue'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
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

    function reconnectOtherNamespaces() {
      sockets.forEach((socketData, namespace) => {
        if (namespace !== '/chats' && !socketData.instance.connected)
          socketData.instance.connect()
      })
    }

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          if (auth.token)
            connectChats(auth.token)

          reconnectOtherNamespaces()
        }
        else {
          disconnectChats()
        }
      })
    }
    else {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          disconnectChats()
        }
        else {
          if (auth.token)
            connectChats(auth.token)

          reconnectOtherNamespaces()
        }
      })

      window.addEventListener('pagehide', () => {
        disconnectChats()
      })
    }
  },
}
