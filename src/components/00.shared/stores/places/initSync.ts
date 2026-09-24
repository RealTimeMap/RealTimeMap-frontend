import { App as CapacitorApp } from '@capacitor/app'
import { onNetworkOnline, useIsOnline } from '@/components/00.shared/composables/useNetworkWatch'
import { useAuthStore } from '@/components/00.shared/stores/auth'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { usePlacesStore } from './store'

/** Интервал фоновой синхронизации (мс). Настраивается здесь. */
export const SYNC_INTERVAL_MS = 2 * 60 * 1000

let initialized = false
let timer: ReturnType<typeof setInterval> | null = null

export function initPlacesSync(): void {
  if (initialized)
    return
  initialized = true

  const store = usePlacesStore()
  const authStore = useAuthStore()
  const settings = useSettingsStore()
  const isOnline = useIsOnline()

  function startTimer() {
    if (timer)
      return
    timer = setInterval(() => {
      if (isOnline.value && authStore.isAuthenticated)
        store.trySync()
    }, SYNC_INTERVAL_MS)
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start() {
    store.hydrate().then(() => store.trySync())
    startTimer()
  }

  function stop() {
    stopTimer()
    store.reset()
  }

  function resetLayersForGuest() {
    settings.showPersonalMarks = false
    if (!settings.showPublicMarks)
      settings.showPublicMarks = true
  }

  watch(
    () => authStore.isAuthenticated,
    (authed, wasAuthed) => {
      if (authed) {
        start()
      }
      else {
        stop()
        if (wasAuthed)
          resetLayersForGuest()
      }
    },
    { immediate: true },
  )

  // Восстановление сети — синхронизируемся сразу.
  onNetworkOnline(() => {
    if (authStore.isAuthenticated)
      store.trySync()
  })

  // Фон/возврат: в фоне таймер на паузе, при возврате — немедленный sync.
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive && authStore.isAuthenticated) {
      startTimer()
      store.trySync()
    }
    else {
      stopTimer()
    }
  })
}
