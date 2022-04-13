const VERSION = 1;
const CACHENAME = `passle-courses-v${VERSION}`;

self.addEventListener('install', () => {
  return self.skipWaiting();
});

self.addEventListener('activate', () => {
  return clients.claim();
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHENAME).then((cache) => {
      return cache.addAll([
        './monaco-editor.js',
        './ts.worker.js',
        './typescript.js',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('passle-courses-') && cacheName !== CACHENAME)
          .map(cacheName => caches.delete(cacheName))
      )
    })
  )
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    }),
  );
});
