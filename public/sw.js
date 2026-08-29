// Transitional kill-switch: removes the previously installed service worker
// (added in the "SEO updates" commit) and its caches, then unregisters itself.
// This is intentionally temporary — once it has run in a user's browser, no
// service worker remains and the app loads fresh from the server.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      await self.clients.claim()
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const c of clients) c.navigate(c.url)
    })()
  )
})
