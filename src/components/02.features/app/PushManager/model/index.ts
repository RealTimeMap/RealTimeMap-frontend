import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/components/00.shared/lib/firebase'
import { requestPermissionInQueue } from '@/components/00.shared/lib/permissions'
import { notificationApi } from '@/components/00.shared/services/notification'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

async function registerDeviceOnBackend(token: string, platform: 'web' | 'android' | 'ios') {
  try {
    const deviceId = localStorage.getItem('device_id') || crypto.randomUUID()
    localStorage.setItem('device_id', deviceId)

    await notificationApi.postToken({
      token,
      deviceId,
      platform,
    })
  }
  catch (e) {
    // Без регистрации токена пуши не придут, но приложение работает — это не повод для баг-репорта
    const status = (e as { status?: number })?.status
    console.warn('Не удалось зарегистрировать push-токен на бэкенде', status ?? e)
  }
}

// === НАТИВНАЯ ЛОГИКА (Android и iOS) ===
let nativeListeners = false

async function initNativePush(store: ReturnType<typeof useNotificationStore>) {
  // Через общую очередь: при запуске одновременно спрашивается геолокация, а iOS при двух
  // системных запросах сразу может так и не показать второе окно
  const permStatus = await requestPermissionInQueue(() => PushNotifications.requestPermissions())
  if (permStatus.receive !== 'granted')
    return

  // Слушатели — до register(), иначе токен может прийти раньше подписки и потеряться
  if (!nativeListeners) {
    nativeListeners = true
    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
    PushNotifications.addListener('registration', (token) => {
      registerDeviceOnBackend(token.value, platform)
    })
    PushNotifications.addListener('registrationError', (error) => {
      console.warn('Push: не удалось получить токен устройства', error.error)
    })
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      store.add({
        title: notification.title || 'Новое уведомление',
        description: notification.body,
        type: 'default',
      })
    })
  }

  await PushNotifications.register()
}

// === WEB ЛОГИКА ===
async function initWebPush(store: ReturnType<typeof useNotificationStore>) {
  const messaging = await getFirebaseMessaging()
  if (!messaging)
    return

  try {
    const token = await getToken(messaging, {
      vapidKey: 'BJ-2l2HP8N-JR9K1hVnMJQ_nyfmySOcg-jqlL6ChFClqttaonezySWOuTrlIo_NForokhNGBN9MWDdVN5khS4-Q',
    })

    if (token) {
      registerDeviceOnBackend(token, 'web')
    }

    onMessage(messaging, (payload) => {
      store.add({
        title: payload.notification?.title || 'Уведомление',
        description: payload.notification?.body,
        type: 'info',
      })
    })
  }
  catch (e) {
    // Пользователь запретил уведомления — штатная ситуация, не баг
    const code = (e as { code?: string })?.code ?? ''
    if (code.includes('permission'))
      console.warn('Web Push недоступен: уведомления запрещены', code)
    else
      console.error('Ошибка получения Web Push токена:', e)
  }
}

// === ПРЕДЛОЖЕНИЕ ВКЛЮЧИТЬ В БРАУЗЕРЕ ===
// Браузер показывает окно разрешения, только если запрос вызван нажатием пользователя: Safari и Firefox
// без нажатия молча отказывают, Chrome прячет запрос в значок адресной строки. Поэтому сначала
// своё ненавязчивое предложение, а системное окно — по кнопке в нём

const OFFER_KEY = 'rtm_push_offer_at'
/** Отказались или закрыли — не предлагаем снова неделю. */
const OFFER_PAUSE_MS = 7 * 24 * 60 * 60_000
/** После входа и заставки — не с порога. */
const OFFER_DELAY_MS = 4000

function offeredRecently(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(OFFER_KEY) ?? 0) < OFFER_PAUSE_MS
  }
  catch {
    return false
  }
}

function rememberOffer() {
  try {
    localStorage.setItem(OFFER_KEY, String(Date.now()))
  }
  catch {}
}

async function offerWebPush(store: ReturnType<typeof useNotificationStore>) {
  if (offeredRecently())
    return
  // iOS Safari без установки на экран «Домой» и режим инкогнито пуши не поддерживают — нечего предлагать
  if (!await getFirebaseMessaging())
    return
  setTimeout(() => {
    if (Notification.permission !== 'default')
      return
    rememberOffer()
    store.add({
      title: 'Включить уведомления?',
      description: 'Сообщения, комментарии и новые подписчики',
      type: 'info',
      duration: 12_000,
      action: {
        text: 'Включить',
        // Запрос — первым действием в обработчике нажатия, иначе браузер не покажет окно
        callback: () => {
          Notification.requestPermission().then((result) => {
            if (result === 'granted')
              initWebPush(store)
          })
        },
      },
    })
  }, OFFER_DELAY_MS)
}

// === ЕДИНАЯ ТОЧКА ВХОДА ===
export async function initPushManager() {
  const notificationStore = useNotificationStore()

  if (Capacitor.isNativePlatform()) {
    await initNativePush(notificationStore)
    return
  }
  if (typeof Notification === 'undefined')
    return
  // Уже разрешили — подключаемся тихо; уже запретили — не беспокоим
  if (Notification.permission === 'granted')
    await initWebPush(notificationStore)
  else if (Notification.permission === 'default')
    await offerWebPush(notificationStore)
}
