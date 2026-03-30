const CACHE_VERSION = 'v1';
const STATIC_CACHE  = `static-${CACHE_VERSION}`;
const ASSET_CACHE   = `assets-${CACHE_VERSION}`;

// Static shell — cached on install, served from cache-first
const PRECACHE_URLS = ['/', '/index.html'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate — purge old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const valid = new Set([STATIC_CACHE, ASSET_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !valid.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  // Never cache API calls
  if (url.pathname.startsWith('/api/')) return;

  // JS/CSS/font/image assets — cache-first, background update
  if (isImmutableAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // HTML navigation — network-first, fallback to cache
  if (request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
});

// ─── Strategies ───────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response('Offline', { status: 503 });
  }
}

function isImmutableAsset(pathname) {
  return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|gif|ico)$/.test(pathname);
}

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* ignore */ }
  const title = data.title || 'Nueva notificación';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: data.data || {},
    tag: data.tag || undefined
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification?.data?.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
