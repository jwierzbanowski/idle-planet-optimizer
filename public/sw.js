const CACHE_NAME = 'ipo-v1'
const ASSETS = [
  '/idle-planet-optimizer/',
  '/idle-planet-optimizer/favicon.svg',
  '/idle-planet-optimizer/manifest.json',
  '/idle-planet-optimizer/og-image.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  if (url.pathname.includes('/data/') || url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request).then((response) => {
            cache.put(event.request, response.clone())
            return response
          })
          return cached || fetched
        })
      )
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
