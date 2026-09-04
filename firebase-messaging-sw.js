// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

// Your exact Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyBG2JNN8K6x_W_wLlJawc0Gwk08ixwJSHM",
  authDomain: "my-baby-35bb9.firebaseapp.com",
  projectId: "my-baby-35bb9",
  storageBucket: "my-baby-35bb9.firebasestorage.app",
  messagingSenderId: "1022726711006",
  appId: "1:1022726711006:web:22fb3e65b46e7fecdb444f"
});

const messaging = firebase.messaging();

// Listen for background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    badge: '/icon-32.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});