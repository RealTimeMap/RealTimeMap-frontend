import type { Messaging } from 'firebase/messaging'
import { initializeApp } from 'firebase/app'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyDL6uNTkmGLA7pybRBV-I_lerqyz-nm3xA',
  authDomain: 'rtm-dev-eb5b8.firebaseapp.com',
  projectId: 'rtm-dev-eb5b8',
  storageBucket: 'rtm-dev-eb5b8.firebasestorage.app',
  messagingSenderId: '12745520538',
  appId: '1:12745520538:web:e09f639dd9707522237623',
  measurementId: 'G-96W88LWZMD',
}

export const firebaseApp = initializeApp(firebaseConfig)

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined')
    return null

  try {
    const supported = await isSupported()
    if (!supported) {
      console.warn('Firebase Messaging не поддерживается (Инкогнито или iOS Safari без PWA)')
      return null
    }
    return getMessaging(firebaseApp)
  }
  catch (error) {
    console.error('Ошибка инициализации Firebase Messaging:', error)
    return null
  }
}
