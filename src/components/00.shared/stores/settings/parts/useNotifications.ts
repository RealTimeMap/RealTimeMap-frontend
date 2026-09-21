import type { NotificationType } from '@/components/00.shared/services/notification/index.type'
import { useDebounceFn } from '@vueuse/core'
import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'
import { notificationApi } from '@/components/00.shared/services/notification'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

const APP_NOTIFICATIONS_COOKIE_NAME = 'app_notifications_enabled'
const MUTED_STORAGE_KEY = 'notif_muted'

type MutedMap = Record<NotificationType, boolean>

function readMuted(): MutedMap {
  const base: MutedMap = { chat: false, comment: false, subscriber: false }
  try {
    const raw = localStorage.getItem(MUTED_STORAGE_KEY)
    return raw ? { ...base, ...JSON.parse(raw) } : base
  }
  catch {
    return base
  }
}

function deviceId(): string {
  let id = localStorage.getItem('device_id')
  if (!id) {
    id = crypto.randomUUID()
    try {
      localStorage.setItem('device_id', id)
    }
    catch { }
  }
  return id
}

export function useNotifications() {
  const isAppNotificationsEnabled = ref<boolean>(
    getCookie(APP_NOTIFICATIONS_COOKIE_NAME) !== 'false',
  )

  function toggleAppNotifications() {
    isAppNotificationsEnabled.value = !isAppNotificationsEnabled.value
  }

  watch(isAppNotificationsEnabled, (value) => {
    setCookie(APP_NOTIFICATIONS_COOKIE_NAME, String(value), 365)
  })

  const mutedNotifications = ref<MutedMap>(readMuted())

  function persistMuted() {
    try {
      localStorage.setItem(MUTED_STORAGE_KEY, JSON.stringify(mutedNotifications.value))
    }
    catch { }
  }

  const inFlight = new Set<NotificationType>()
  const desired = new Map<NotificationType, boolean>()
  const lastSent = new Map<NotificationType, boolean>()
  const PATCH_DEBOUNCE_MS = 600
  const debouncedFlush = new Map<NotificationType, () => void>()
  function scheduleFlush(type: NotificationType) {
    let fn = debouncedFlush.get(type)
    if (!fn) {
      fn = useDebounceFn(() => flush(type), PATCH_DEBOUNCE_MS)
      debouncedFlush.set(type, fn)
    }
    fn()
  }

  async function flush(type: NotificationType) {
    if (inFlight.has(type))
      return
    inFlight.add(type)
    try {
      while (desired.has(type)) {
        const muted = desired.get(type)!
        desired.delete(type)
        if (lastSent.get(type) === muted)
          continue
        await notificationApi.patchTokens({ deviceId: deviceId(), muted: { [type]: muted } })
        lastSent.set(type, muted)
      }
    }
    catch {
      desired.delete(type)
      useNotificationStore().add({
        title: 'Не удалось изменить настройку уведомлений',
        type: 'error',
      })
    }
    finally {
      inFlight.delete(type)
    }
  }

  function setNotificationType(type: NotificationType, enabled: boolean) {
    const nextMuted = !enabled
    if (mutedNotifications.value[type] === nextMuted)
      return
    mutedNotifications.value = { ...mutedNotifications.value, [type]: nextMuted }
    persistMuted()
    desired.set(type, nextMuted)
    scheduleFlush(type)
  }

  return {
    isAppNotificationsEnabled,
    toggleAppNotifications,
    mutedNotifications,
    setNotificationType,
  }
}
