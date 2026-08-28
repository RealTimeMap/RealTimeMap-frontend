import { Capacitor } from '@capacitor/core'
import { LiveCapsule } from '@/components/00.shared/lib/liveCapsule'

export async function showRouteNotification(text: string, shortText: string): Promise<void> {
  if (!Capacitor.isNativePlatform())
    return

  try {
    await LiveCapsule.showStatus({ text, shortText })
  }
  catch (e) {
    console.error('[RouteCapsule] Не удалось показать капсулу:', e)
  }
}

export async function hideRouteNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform())
    return

  try {
    await LiveCapsule.hideStatus()
  }
  catch { }
}
