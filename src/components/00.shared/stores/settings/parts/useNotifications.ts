import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

const APP_NOTIFICATIONS_COOKIE_NAME = 'app_notifications_enabled'
const SYSTEM_NOTIFICATIONS_COOKIE_NAME = 'system_notifications_enabled'

export function useNotifications() {
  // --- STATE ---
  // Внутренние уведомления приложения (тосты)
  const isAppNotificationsEnabled = ref<boolean>(
    getCookie(APP_NOTIFICATIONS_COOKIE_NAME) !== 'false',
  )
  // Системные уведомления (нативные пуши на устройстве)
  const isSystemNotificationsEnabled = ref<boolean>(
    getCookie(SYSTEM_NOTIFICATIONS_COOKIE_NAME) !== 'false',
  )

  // --- ACTIONS ---
  function toggleAppNotifications() {
    isAppNotificationsEnabled.value = !isAppNotificationsEnabled.value
  }

  function toggleSystemNotifications() {
    isSystemNotificationsEnabled.value = !isSystemNotificationsEnabled.value
  }

  // --- WATCHERS ---
  watch(isAppNotificationsEnabled, (value) => {
    setCookie(APP_NOTIFICATIONS_COOKIE_NAME, String(value), 365)
  })

  watch(isSystemNotificationsEnabled, (value) => {
    setCookie(SYSTEM_NOTIFICATIONS_COOKIE_NAME, String(value), 365)
  })

  return {
    isAppNotificationsEnabled,
    isSystemNotificationsEnabled,
    toggleAppNotifications,
    toggleSystemNotifications,
  }
}
