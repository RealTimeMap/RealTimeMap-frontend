import { Capacitor } from '@capacitor/core'

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

export async function setupPWA() {
  if (Capacitor.isNativePlatform()) {
    await unregisterServiceWorkers()
    return
  }

  const { registerSW } = await import('virtual:pwa-register')
  registerSW({ immediate: true })
}
