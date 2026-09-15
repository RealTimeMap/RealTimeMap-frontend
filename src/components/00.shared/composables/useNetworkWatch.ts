import type { PluginListenerHandle } from '@capacitor/core'
import type { ConnectionStatus } from '@capacitor/network'
import { Network } from '@capacitor/network'
import { getCurrentInstance, onUnmounted, ref } from 'vue'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

let listenerHandle: PluginListenerHandle | null = null
let timerId: ReturnType<typeof setTimeout> | null = null
let hasNotifiedOffline = false
let activeUsersCount = 0
let initPromise: Promise<void> | null = null

/** Глобальный реактивный статус сети (доступен без монтирования компонента). */
const isOnline = ref(true)

/** Подписчики на переход offline → online (для запуска синхронизации). */
const onlineCallbacks = new Set<() => void>()

/** Подписаться на событие «сеть восстановлена». Возвращает отписку. */
export function onNetworkOnline(cb: () => void): () => void {
  onlineCallbacks.add(cb)
  return () => onlineCallbacks.delete(cb)
}

/** Реактивный флаг наличия сети. */
export function useIsOnline() {
  return isOnline
}

function handleNetworkChange(status: ConnectionStatus) {
  const notify = useNotificationStore()

  const wasOnline = isOnline.value
  isOnline.value = status.connected
  if (status.connected && !wasOnline)
    onlineCallbacks.forEach(cb => cb())

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
      isOnline.value = status.connected
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
