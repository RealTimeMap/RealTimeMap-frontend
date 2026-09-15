import { App as CapacitorApp } from '@capacitor/app'
import { onNetworkOnline, useIsOnline } from '@/components/00.shared/composables/useNetworkWatch'
import { usePlacesStore } from './store'

/** Интервал фоновой синхронизации (мс). Настраивается здесь. */
export const SYNC_INTERVAL_MS = 2 * 60 * 1000

let initialized = false
let timer: ReturnType<typeof setInterval> | null = null

/**
 * Инициализация офлайн-синхронизации раздела «Места».
 * Гидратирует стор, делает первичный sync и держит данные актуальными:
 *  - периодический sync каждые SYNC_INTERVAL_MS (пока приложение активно и есть сеть);
 *  - мгновенный sync при восстановлении сети и при возврате из фона;
 *  - таймер ставится на паузу в фоне, чтобы не жечь батарею/трафик.
 */
export function initPlacesSync(): void {
  if (initialized)
    return
  initialized = true

  const store = usePlacesStore()
  const isOnline = useIsOnline()

  store.hydrate().then(() => store.trySync())

  function startTimer() {
    if (timer)
      return
    timer = setInterval(() => {
      if (isOnline.value)
        store.trySync()
    }, SYNC_INTERVAL_MS)
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  startTimer()

  // Восстановление сети — синхронизируемся сразу.
  onNetworkOnline(() => store.trySync())

  // Фон/возврат: в фоне таймер на паузе, при возврате — немедленный sync.
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      startTimer()
      store.trySync()
    }
    else {
      stopTimer()
    }
  })
}
