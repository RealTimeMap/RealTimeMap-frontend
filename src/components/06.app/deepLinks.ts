import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import router from '@/components/00.shared/lib/router'

const APP_HOSTS = ['real-time-map-frontend.vercel.app']

export function setupDeepLinks() {
  if (!Capacitor.isNativePlatform())
    return

  CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    try {
      const parsed = new URL(url)

      if (!APP_HOSTS.includes(parsed.hostname))
        return

      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`
      router.push(path)
    }
    catch (e) {
      console.error('Ошибка обработки deep link:', url, e)
    }
  })
}
