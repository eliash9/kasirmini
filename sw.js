const CACHE_NAME = 'kasirmini-cache-v11';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  // PWA icons
  './icons/ios/16.png',
  './icons/ios/32.png',
  './icons/ios/180.png',
  './icons/android/android-launchericon-192-192.png',
  './icons/android/android-launchericon-512-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => {
      if (key !== CACHE_NAME) return caches.delete(key);
    })))
  );
  self.clients.claim();
});

// Cache-first for all GET requests; fallback to network and cache runtime
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // ignore non-GET

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        try {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        } catch (_) {}
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
