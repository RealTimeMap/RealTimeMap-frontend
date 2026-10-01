import { Capacitor } from '@capacitor/core'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator))
    return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(registration => registration.unregister()))

    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    }
  }
  catch (error) {
    console.error('[PWA] Не удалось удалить service worker:', error)
  }
}

/**
 * Старый кэш картинок: CORS-запросы аватаров получали из него непрозрачные ответы и не загружались.
 * Новый service worker пишет в remote-images-v2, этот больше не нужен.
 */
const OUTDATED_CACHES = ['remote-images']

async function dropOutdatedCaches() {
  if (!('caches' in window))
    return
  try {
    await Promise.all(OUTDATED_CACHES.map(name => caches.delete(name)))
  }
  catch {}
}

export async function setupPWA() {
  if (Capacitor.isNativePlatform()) {
    await unregisterServiceWorkers()
    return
  }

  void dropOutdatedCaches()
  const { registerSW } = await import('virtual:pwa-register')

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      const notify = useNotificationStore()
      notify.add({
        title: 'Доступно обновление',
        description: 'Перезагрузите страницу, чтобы применить новую версию.',
        type: 'default',
        icon: 'app:refresh',
        duration: 0,
        action: {
          text: 'Обновить',
          callback: () => updateSW(true),
        },
      })
    },
  })
}
