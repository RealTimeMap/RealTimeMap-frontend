import { useSettingsStore } from '@/components/00.shared/stores/settings'

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
  closing?: boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  function add(notification: Omit<Notification, 'id'>) {
    const settings = useSettingsStore()
    if (!settings.isAppNotificationsEnabled)
      return undefined

    const id = Math.random().toString(36).substring(2, 9)
    notifications.value.push({ ...notification, id })

    const active = notifications.value.filter(n => !n.closing)
    if (active.length > 3)
      active[0].closing = true

    return id
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications,
    add,
    remove,
  }
})
