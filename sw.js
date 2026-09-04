/* sw.js – Our Little Universe Service Worker with Push Support */

const CACHE_NAME = 'olu-cache-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-32.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=DM+Sans:opsz,wght@9..40,300..600&family=Caveat:wght@400;500&display=swap'
];

// ── Install ──
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { credentials: 'omit' }))))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch (stale-while-revalidate) ──
self.addEventListener('fetch', evt => {
  const req = evt.request;
  const url = new URL(req.url);
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.hostname.includes('firebasestorage.app') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('metered.live') ||
    url.hostname.includes('metered.ca') ||
    url.protocol === 'wss:' || url.protocol === 'ws:' ||
    req.method !== 'GET'
  ) {
    return;
  }
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});

// ── Push Notification Handler ──
self.addEventListener('push', evt => {
  let data = { title: '🌸 Mood Reminder', body: 'How are you feeling today? Log your mood 💕', icon: 'icon-192.png' };
  if (evt.data) {
    try {
      const parsed = evt.data.json();
      data = { ...data, ...parsed };
    } catch (_) {}
  }
  evt.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || 'icon-192.png',
      badge: 'icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || './index.html#mood' }
    })
  );
});

// ── Notification Click ──
self.addEventListener('notificationclick', evt => {
  evt.notification.close();
  evt.waitUntil(
    clients.openWindow(evt.notification.data.url || './index.html')
  );
});