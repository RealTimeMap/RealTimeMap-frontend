import { Capacitor } from '@capacitor/core'
import { notificationApi } from '@/components/00.shared/services/notification'

const DEVICE_ID_KEY = 'device_id'
/** Выход не ждёт медленную сеть дольше этого. */
const FORGET_TIMEOUT_MS = 3000

/** Постоянный id устройства: по нему бэкенд хранит push-токен и настройки уведомлений. */
export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    try {
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    catch { }
  }
  return id
}

async function forgetOnBackend() {
  const id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id)
    return
  try {
    await notificationApi.deleteToken(id)
  }
  catch (e) {
    console.warn('Не удалось удалить push-токен на бэкенде', (e as { status?: number })?.status ?? e)
  }
}

/** Токен на самом устройстве: при следующем входе Firebase выдаст новый. */
async function forgetOnDevice() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      await PushNotifications.unregister()
      return
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted')
      return
    const [{ getFirebaseMessaging }, { deleteToken }] = await Promise.all([
      import('@/components/00.shared/lib/firebase'),
      import('firebase/messaging'),
    ])
    const messaging = await getFirebaseMessaging()
    if (messaging)
      await deleteToken(messaging)
  }
  catch (e) {
    console.warn('Не удалось удалить push-токен на устройстве', e)
  }
}

/**
 * Выход из аккаунта: пуши этого аккаунта больше не должны приходить на устройство.
 * Вызывать до отзыва сессии — бэкенду нужен ещё действующий токен авторизации.
 */
export async function forgetPushDevice(): Promise<void> {
  const timeout = new Promise<void>(resolve => setTimeout(resolve, FORGET_TIMEOUT_MS))
  await Promise.race([Promise.all([forgetOnBackend(), forgetOnDevice()]), timeout])
}
