import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/components/00.shared/lib/firebase'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

async function registerDeviceOnBackend(token: string, platform: 'web' | 'android') {
  try {
    const deviceId = localStorage.getItem('device_id') || crypto.randomUUID()
    localStorage.setItem('device_id', deviceId)

    console.warn('firebase', {
      deviceId,
      platform,
      fullToken: token,
    })

    // await api.post('/notifications/device', {
    //   device_id: deviceId,
    //   fcm_token: token,
    //   platform,
    // })
  }
  catch (e) {
    console.error('Ошибка отправки токена на бэкенд:', e)
  }
}

// === ANDROID ЛОГИКА ===
async function initAndroidPush(store: ReturnType<typeof useNotificationStore>) {
  const permStatus = await PushNotifications.requestPermissions()
  if (permStatus.receive !== 'granted')
    return

  await PushNotifications.register()

  PushNotifications.addListener('registration', (token) => {
    registerDeviceOnBackend(token.value, 'android')
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    store.add({
      title: notification.title || 'Новое уведомление',
      description: notification.body,
      type: 'default',
    })
  })
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
    console.error('Ошибка получения Web Push токена:', e)
  }
}

// === ЕДИНАЯ ТОЧКА ВХОДА ===
export async function initPushManager() {
  const notificationStore = useNotificationStore()

  if (Capacitor.isNativePlatform()) {
    await initAndroidPush(notificationStore)
  }
  else {
    await initWebPush(notificationStore)
  }
}
