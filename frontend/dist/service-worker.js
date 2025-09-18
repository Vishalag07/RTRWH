const CACHE_NAME = 'rtrwh-cache-v1';
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
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
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
