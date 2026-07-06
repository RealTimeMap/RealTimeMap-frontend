import type { PluginListenerHandle } from '@capacitor/core'
import type { ConnectionStatus } from '@capacitor/network'
import { Network } from '@capacitor/network'
import { getCurrentInstance, onUnmounted } from 'vue'
import { useNotificationStore } from '@/shared/stores/notification'

let listenerHandle: PluginListenerHandle | null = null
let timerId: ReturnType<typeof setTimeout> | null = null
let hasNotifiedOffline = false
let activeUsersCount = 0
let initPromise: Promise<void> | null = null

function handleNetworkChange(status: ConnectionStatus) {
  const notify = useNotificationStore()

  if (!status.connected) {
    if (!timerId) {
      timerId = setTimeout(() => {
        notify.add({
          title: 'Проблемы со связью',
          description: 'Интернет пропал. Карта переведена в автономный режим.',
          type: 'warning',
        })
        hasNotifiedOffline = true
        timerId = null
      }, 3000)
    }
  }
  else {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }

    if (hasNotifiedOffline) {
      notify.add({
        title: 'Сеть восстановлена',
        description: 'Приложение снова подключено к серверу реального времени.',
        type: 'success',
      })
      hasNotifiedOffline = false
    }
  }
}

async function destroyGlobalListener() {
  if (activeUsersCount > 0) {
    activeUsersCount--
  }

  if (activeUsersCount === 0) {
    if (initPromise) {
      try {
        await initPromise
      }
      catch (error) {
        console.warn('NetworkWatch: Cleanup waiting for init failed', error)
      }
    }

    if (listenerHandle) {
      await listenerHandle.remove()
      listenerHandle = null
    }

    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }

    hasNotifiedOffline = false
    initPromise = null
  }
}

async function initGlobalListener() {
  activeUsersCount++

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      const status = await Network.getStatus()
      if (!status.connected) {
        handleNetworkChange(status)
      }
      listenerHandle = await Network.addListener('networkStatusChange', handleNetworkChange)
    }
    catch (error) {
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

export function useNetworkWatch() {
  const instance = getCurrentInstance()

  if (instance) {
    onUnmounted(() => {
      destroyGlobalListener()
    })
  }

  return {
    initNetworkListener: initGlobalListener,
    destroyNetworkListener: destroyGlobalListener,
  }
}
