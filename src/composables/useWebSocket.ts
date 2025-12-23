import type { Socket } from 'socket.io-client'
import type { DeepReadonly } from 'vue'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socketEvents'
import { io } from 'socket.io-client'

interface WebSocketState {
  isConnected: boolean
}

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface UseWebSocketReturn {
  connect: (namespace: string, auth?: { token: string } | null) => void
  disconnect: (namespace: string) => void
  on: <Ev extends keyof ServerToClientEvents & string>(
    namespace: string,
    event: Ev,
    callback: ServerToClientEvents[Ev],
  ) => () => void
  emit: <Ev extends keyof ClientToServerEvents & string>(
    namespace: string,
    event: Ev,
    ...args: Parameters<ClientToServerEvents[Ev]>
  ) => void
  sockets: DeepReadonly<Map<string, { instance: AppSocket, state: WebSocketState }>>
  getSocketState: (namespace: string) => WebSocketState | undefined
}
type SocketMap = Map<string, { instance: AppSocket, state: WebSocketState }>

const sockets = reactive<SocketMap>(new Map())

export function useWebSocket(): UseWebSocketReturn {
  const connect = (namespace: string, auth: { token: string } | null = null) => {
    if (sockets.has(namespace)) {
      console.warn(`[WebSocket] Connection to namespace "${namespace}" already exists.`)
      return
    }

    const WEBSOCKET_URL = import.meta.env.VITE_WS_URL
    if (!WEBSOCKET_URL) {
      console.error('[WebSocket] VITE_WS_URL is not defined in .env file.')
      return
    }

    const fullUrl = `${WEBSOCKET_URL}${namespace}`
    console.warn(`[WebSocket] Attempting to connect to ${fullUrl}`)

    const socket = io(fullUrl, {
      ...(auth && { auth }),
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })

    const state: WebSocketState = reactive({ isConnected: false })
    sockets.set(namespace, { instance: socket, state })

    socket.on('connect', () => {
      console.warn(`[WebSocket] Connected successfully to namespace "${namespace}".`)
      state.isConnected = true
    })

    socket.on('disconnect', (reason) => {
      console.warn(`[WebSocket] Disconnected from "${namespace}": ${reason}`)
      state.isConnected = false
      // sockets.delete(namespace)
    })

    socket.on('connect_error', (error) => {
      console.error(`[WebSocket] Connection Error for "${namespace}":`, error.message)
      state.isConnected = false
      sockets.delete(namespace)
    })

    socket.connect()
  }

  const disconnect = (namespace: string) => {
    const socketData = sockets.get(namespace)
    if (socketData) {
      socketData.instance.disconnect()
      sockets.delete(namespace)
      console.warn(`[WebSocket] Disconnected from namespace "${namespace}" by client.`)
    }
  }

  const on = <Ev extends keyof ServerToClientEvents & string>(
    namespace: string,
    event: Ev,
    callback: ServerToClientEvents[Ev],
  ): (() => void) => {
    const socketData = sockets.get(namespace)
    if (!socketData) {
      console.warn(`[WebSocket] Cannot subscribe. No connection to namespace "${namespace}".`)
      return () => { }
    }
    socketData.instance.on(event, callback as any)
    return () => socketData.instance.off(event, callback as any)
  }

  const emit = <Ev extends keyof ClientToServerEvents & string>(
    namespace: string,
    event: Ev,
    ...args: Parameters<ClientToServerEvents[Ev]>
  ) => {
    const socketData = sockets.get(namespace)
    if (socketData?.state.isConnected) {
      socketData.instance.emit(event, ...args)
    }
    else {
      console.error(`[WebSocket] Cannot emit. Not connected to namespace "${namespace}".`)
    }
  }

  const getSocketState = (namespace: string) => {
    return sockets.get(namespace)?.state
  }

  return {
    connect,
    disconnect,
    on,
    emit,
    sockets: readonly(sockets),
    getSocketState,
  }
}
