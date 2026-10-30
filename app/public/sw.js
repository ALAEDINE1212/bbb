/* Our Little Universe — service worker (new app).
 * Same job as the legacy sw.js: cache the shell so the app opens instantly and offline, never
 * touch live Firebase / WebRTC / weather traffic, and show push notifications in the background.
 * Bump CACHE_NAME on any change to this file. */

const CACHE_NAME = 'olu-app-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png', './icon-32.png'];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL))
      .catch(() => { /* flaky first install — runtime caching fills in */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  const req = evt.request;
  const url = new URL(req.url);
  // Live data must always go to the network (same exclusions as the legacy worker).
  if (
    req.method !== 'GET' ||
    url.protocol === 'ws:' || url.protocol === 'wss:' ||
    /firebaseio\.com|firebase\.googleapis\.com|firebasestorage|googleapis\.com|gstatic\.com|metered\.|expressturn|open-meteo\.com|openstreetmap\.org|themoviedb\.org|nominatim/.test(url.hostname)
  ) return;

  // Page navigations: network first so a new release shows up, cached shell when offline.
  if (req.mode === 'navigate') {
    evt.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put('./index.html', copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // Everything else (hashed JS/CSS, icons, posters): stale-while-revalidate.
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});

self.addEventListener('message', evt => { if (evt.data === 'SKIP_WAITING') self.skipWaiting(); });

/* Background push (Firebase Cloud Messaging), as in the legacy worker. */
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAlPxlXJH6e2Yf2MRBOWK6Q9zotEHyk780',
  authDomain: 'my-baby-35bb9.firebaseapp.com',
  projectId: 'my-baby-35bb9',
  storageBucket: 'my-baby-35bb9.firebasestorage.app',
  messagingSenderId: '1022726711006',
  appId: '1:1022726711006:web:22fb3e65b46e7fecdb444f'
});

firebase.messaging().onBackgroundMessage(payload => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || 'New Message', { body: n.body, icon: './icon-192.png', badge: './icon-32.png' });
});

self.addEventListener('notificationclick', evt => {
  evt.notification.close();
  evt.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => list[0] ? list[0].focus() : self.clients.openWindow('./')));
});
