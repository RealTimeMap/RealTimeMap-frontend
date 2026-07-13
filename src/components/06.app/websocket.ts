import type { App } from 'vue'
import { App as CapacitorApp } from '@capacitor/app'
import { useWebSocket } from '@/components/00.shared/composables/useWebSocket'

export default {
  install: (_app: App) => {
    const { connect, sockets } = useWebSocket()

    connect('/marks')

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
