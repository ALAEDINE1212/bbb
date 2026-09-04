/* Our Little Universe — Service Worker
 * Lightweight: caches the shell so the app loads instantly and works offline.
 * Bumps the cache name on every release. */

const CACHE_NAME = 'olu-cache-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-32.png',
  // 3rd-party libs the app uses (cached so call UI loads offline once seen)
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=DM+Sans:opsz,wght@9..40,300..600&family=Caveat:wght@400;500&display=swap'
];

/* INSTALL — pre-cache the shell */
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { credentials: 'omit' }))))
      .catch(() => { /* network may be flaky on first install — fine */ })
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE — clean up old caches */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* FETCH — strategy depends on the request */
self.addEventListener('fetch', evt => {
  const req = evt.request;
  const url = new URL(req.url);

  // Never intercept Firebase / WebSocket / Realtime DB / WebRTC signaling.
  // These MUST go straight to the network — caching breaks live updates.
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
    return; // let the browser handle it normally
  }

  // Stale-while-revalidate for everything else (fonts, libs, html, icons)
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        }).catch(() => cached); // offline → fall back to cache
        return cached || network;
      })
    )
  );
});

/* Listen for skipWaiting message from the page (so updates apply on reload) */
self.addEventListener('message', evt => {
  if (evt.data === 'SKIP_WAITING') self.skipWaiting();
});
