import type { App } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'

export default {
  install: (_app: App) => {
    const { connect } = useWebSocket()

    connect('/mark')
  },
}
