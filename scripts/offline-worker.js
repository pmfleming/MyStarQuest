/* global self, caches, fetch, URL, Request, Response, Headers, AbortController, setTimeout, clearTimeout */
// Build replaces this marker with a version and the complete code/font list.
const { version, core } = __OFFLINE_BUILD__  
const shellName = `msq-shell-${version}`
const mediaName = 'msq-media-v1'
const staticPath = (url) =>
  url.origin === self.location.origin &&
  (/^\/assets\/[^/]+\.(js|css|woff2?|png|webp|svg|jpg|jpeg)$/.test(
    url.pathname
  ) ||
    url.pathname === '/data/world-50m-2024.json')
const corePaths = new Set(core)

async function download(request) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(request, { signal: controller.signal })
    if (!response.ok || response.redirected)
      throw new Error('Unavailable resource')
    const path = new URL(
      typeof request === 'string' ? request : request.url,
      self.location.origin
    ).pathname
    if (
      path !== '/index.html' &&
      response.headers.get('Content-Type')?.includes('text/html')
    )
      throw new Error('Unexpected HTML response')
    // Keep the deadline active through the body, including stalled downloads.
    const body = await response.arrayBuffer()
    const headers = new Headers(response.headers)
    headers.delete('Content-Encoding')
    headers.delete('Content-Length')
    return new Response(body, {
      status: response.status,
      headers,
    })
  } finally {
    clearTimeout(timer)
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(shellName)
      try {
        // Limit concurrency so offline preparation does not flood a slow connection.
        const paths = ['/index.html', ...core]
        for (let i = 0; i < paths.length; i += 3) {
          await Promise.all(
            paths.slice(i, i + 3).map(async (path) => {
              const response = await download(
                new Request(path, { cache: 'reload' })
              )
              await cache.put(path, response)
            })
          )
        }
      } catch (error) {
        await caches.delete(shellName)
        throw error
      }
      // Let an update wait until existing pages close; do not mix build versions.
    })()
  )
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith('msq-shell-') && name !== shellName)
          await caches.delete(name)
      }
      await self.clients.claim()
    })()
  )
})

let mediaWrites = Promise.resolve()
function saveMedia(request, response) {
  // Serialize writes/eviction across tabs and keep at most 128 visited resources.
  mediaWrites = mediaWrites
    .catch(() => {})
    .then(async () => {
      const cache = await caches.open(mediaName)
      await cache.put(request, response)
      const keys = await cache.keys()
      for (const key of keys.slice(0, Math.max(0, keys.length - 128)))
        await cache.delete(key)
    })
  return mediaWrites.catch(() => {}) // Quota failures must not break an online page.
}
async function asset(request, event) {
  const url = new URL(request.url)
  try {
    const cache = await caches.open(
      corePaths.has(url.pathname) ? shellName : mediaName
    )
    // These are immutable, public, same-origin build files. Module requests can
    // carry an Origin header that differs from installation (Vary: Origin).
    const cached = await cache.match(request, { ignoreVary: true })
    if (cached) return cached
  } catch {
    /* A cache failure must not prevent a working network request. */
  }
  const response = await download(request)
  if (!corePaths.has(url.pathname))
    event.waitUntil(saveMedia(request, response.clone()))
  return response
}
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  // Never intercept Firebase auth helpers, API requests, or account data.
  if (
    request.mode === 'navigate' &&
    (url.pathname === '/' ||
      url.pathname === '/login' ||
      url.pathname.startsWith('/tabs') ||
      url.pathname.startsWith('/settings/') ||
      url.pathname === '/today')
  ) {
    event.respondWith(
      caches
        .open(shellName)
        .then(
          async (cache) =>
            (await cache.match('/index.html')) ?? download(request)
        )
        .catch(() => download(request))
    )
  } else if (staticPath(url)) {
    event.respondWith(
      asset(request, event).catch(() => new Response('', { status: 503 }))
    )
  }
})
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_VISITED' || !Array.isArray(event.data.urls))
    return
  event.waitUntil(
    (async () => {
      for (const path of event.data.urls.slice(0, 128)) {
        if (typeof path !== 'string') continue
        const url = new URL(path, self.location.origin)
        if (!staticPath(url) || corePaths.has(url.pathname)) continue
        try {
          await asset(new Request(url), event)
        } catch {
          /* Recover when visited online. */
        }
      }
    })()
  )
})
