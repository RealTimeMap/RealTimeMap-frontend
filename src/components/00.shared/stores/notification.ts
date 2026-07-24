import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { requestPermissionInQueue } from '@/components/00.shared/lib/permissions'

export type NotificationType
  = 'info' | 'error' | 'success' | 'warning' | 'default'

export interface Notification {
  id: string
  title: string
  description?: string
  icon?: string
  type: NotificationType
  duration?: number
  action?: {
    callback: () => void
    text: string
  }
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  async function requestPermissions() {
    if (!Capacitor.isNativePlatform())
      return

    const perm = await LocalNotifications.checkPermissions()
    if (perm.display === 'granted')
      return

    await requestPermissionInQueue(() => LocalNotifications.requestPermissions())
  }

  async function add(notification: Omit<Notification, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification = { ...notification, id }
    notifications.value.push(newNotification)

    if (notification.duration !== 0) {
      setTimeout(remove, notification.duration || 5000, id)
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title: notification.title,
              body: notification.description || '',
              channelId: 'default',
              largeBody: notification.description,
              schedule: { at: new Date(Date.now() + 10) },
              actionTypeId: '',
              extra: null,
            },
          ],
        })
      }
      catch (e) {
        console.error('[LocalNotifications] Ошибка отправки пуша:', e)
      }
    }
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications,
    add,
    remove,
    requestPermissions,
  }
})
