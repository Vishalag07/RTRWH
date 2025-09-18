const CACHE_NAME = 'rtrwh-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return; // let the browser handle it
  }

  const isSameOrigin = new URL(event.request.url).origin === self.location.origin;

  event.respondWith((async () => {
    try {
      // For cross-origin (e.g., API) requests, just fetch without cache match to avoid CORS issues
      if (!isSameOrigin) {
        return await fetch(event.request);
      }

      // Try cache first, then network
      const cached = await caches.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      // Optionally cache successful same-origin responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone());
      return response;
    } catch (err) {
      // On failure, if it's a navigation request, serve the shell
      if (event.request.mode === 'navigate') {
        const cachedIndex = await caches.match('/index.html');
        if (cachedIndex) return cachedIndex;
      }
      // As a last resort, return a generic error response
      return new Response('Offline or fetch failed', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'RTRWH', body: 'You have a new notification.' };
  const { title, body } = data;

  const options = {
    body,
    icon: '/icon-192.svg',
    badge: '/favicon.svg',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
