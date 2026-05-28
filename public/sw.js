// Broslunas Clock — Service Worker
// Strategy: Cache-first for assets, Network-first for pages

const CACHE_NAME = 'broslunas-clock-v1';
const STATIC_CACHE_NAME = 'broslunas-clock-static-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/stopwatch',
  '/pomodoro',
  '/timer',
  '/world-clock',
  '/en/',
  '/en/stopwatch',
  '/en/pomodoro',
  '/en/timer',
  '/en/world-clock',
  '/fr/',
  '/fr/stopwatch',
  '/fr/pomodoro',
  '/fr/timer',
  '/fr/world-clock',
  '/pt/',
  '/pt/stopwatch',
  '/pt/pomodoro',
  '/pt/timer',
  '/pt/world-clock',
  '/de/',
  '/de/stopwatch',
  '/de/pomodoro',
  '/de/timer',
  '/de/world-clock',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// ─── Install: pre-cache static shell ───────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: strategy routing ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (e.g. Google Fonts, TimeAPI)
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: Network-first, fallback to cache → offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): Cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: Network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
