/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
const CACHE = PREFIX + '2026-09-09'
const INDEX = new URL('index.html', SCOPE).href

self.addEventListener('install', (event) => {
  // Wait until existing clients close: no mixed bundle versions.
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(INDEX)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return
  const navigation = request.mode === 'navigate'
  const key = navigation ? INDEX : request
  const task = (async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(key)
    const network = fetch(request).then(async response => {
      if (response.ok) {
        try { await cache.put(key, response.clone()) } catch { /* Storage full: keep online response. */ }
      }
      return response.ok ? response : cached ?? response
    }).catch(() => cached ?? Response.error())
    // Data changes without hashed filenames: prefer fresh JSON. Artwork and
    // bundles can render immediately while refreshing in the background.
    const fresh = navigation || /\.json(?:\.gz)?$/.test(new URL(request.url).pathname)
    if (cached && !fresh) return { response: cached, network }
    if (!cached) return { response: await network, network }
    let timer
    const fallback = new Promise(resolve => { timer = setTimeout(() => resolve(cached), 4000) })
    const response = await Promise.race([network, fallback])
    clearTimeout(timer)
    return { response, network }
  })()
  event.respondWith(task.then(result => result.response))
  event.waitUntil(task.then(result => result.network).then(() => undefined))
})
