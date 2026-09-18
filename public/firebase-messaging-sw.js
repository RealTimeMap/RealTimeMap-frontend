importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDL6uNTkmGLA7pybRBV-I_lerqyz-nm3xA',
  authDomain: 'rtm-dev-eb5b8.firebaseapp.com',
  projectId: 'rtm-dev-eb5b8',
  storageBucket: 'rtm-dev-eb5b8.firebasestorage.app',
  messagingSenderId: '12745520538',
  appId: '1:12745520538:web:e09f639dd9707522237623',
  measurementId: 'G-96W88LWZMD',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
