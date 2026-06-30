export type NotificationType = 'info' | 'error' | 'success' | 'warning' | 'default'

export interface Notification {
  id: string
  title: string
  description?: string
  icon?: string
  type: NotificationType
  duration?: number
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  function add(notification: Omit<Notification, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification = { ...notification, id }

    notifications.value.push(newNotification)

    if (notification.duration !== 0) {
      setTimeout(remove, notification.duration || 5000, id)
    }
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return { notifications, add, remove }
})
