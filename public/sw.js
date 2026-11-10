self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await caches.delete('tipitaka-v1');
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    await self.registration.unregister();
    for (const client of clients) {
      const url = new URL(client.url);
      url.searchParams.set('_sw_refresh', Date.now().toString());
      client.navigate(url.href).catch((error) => {
        console.error('Could not refresh a page after retiring the legacy cache:', error);
      });
    }
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })));
  }
});
