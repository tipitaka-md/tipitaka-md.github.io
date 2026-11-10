self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await caches.delete('tipitaka-v1');
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
