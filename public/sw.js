// ============================================
// Service Worker — basic cache-first strategy
// ============================================
// Caches the app shell for fast loading.
// Network requests to Supabase always go to network.

const CACHE_NAME = 'soar-hp-v4'
const SHELL_URLS = [
  '/',
  '/index.html',
]

// Cache app shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  )
  self.skipWaiting()
})

// Clean old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first for API calls, cache-first for app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Always go to network for Supabase API calls
  if (url.hostname.includes('supabase.co')) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful responses for app assets
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})