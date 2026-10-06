/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
const BUILD_VERSION="27b5a1102a93ead7"; const BUILD_SHELL=["index.html","legal.html","theme.js","telegram.js","manifest.webmanifest","favicon.svg","assets/Book-BTpe55iF.js","assets/Clock-S2j4Bz9n.js","assets/CompactChoice-BjHONKwH.js","assets/Drill-C4LiWjtN.js","assets/Duo-CSXdm6jt.js","assets/Editor-V7YLXOAs.js","assets/GameCard-BGTqaNHm.js","assets/GameSearch-psdCphy8.js","assets/Homework-ClRSbjCU.js","assets/Lab-D11GCQ-h.js","assets/Loading-B0VxJVLl.js","assets/Loading-CLNoOFvU.css","assets/Play-DYN-D6Cf.js","assets/Profile-Cf1fTFm_.js","assets/Profile-PQU_8MAc.css","assets/Race-C1-5JPHU.js","assets/San-CyAtL1rv.js","assets/Sets-CNxV7oED.js","assets/Sheet-BTv5b3yj.js","assets/Studies-INVfkwWp.css","assets/Studies-NorBTMVB.js","assets/Team-B7gXk0fi.js","assets/archiveDiscovery-BhlumLZJ.js","assets/browser-DVTTPdyi.js","assets/clock-_antc8e_.js","assets/drills-Bcs_I-mb.js","assets/index-DdGHazb_.css","assets/index-Dz1A2axX.js","assets/jsonDecode.worker-GvfOo3Q0.js","assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","assets/literata-greek-wght-normal-CO1l-giJ.woff2","assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","assets/literata-latin-wght-normal-DLxlUchJ.woff2","assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","assets/onest-cyrillic-wght-normal-DXI_y_WF.woff2","assets/onest-latin-ext-wght-normal-CnNj8hVb.woff2","assets/onest-latin-wght-normal-CUIqqgP9.woff2","assets/openLessonPosition-jr7JwTDv.js","assets/photos-D8YTDcrH.js","assets/router-BvNy3ul8.js","assets/scrollLock-D_EXxR-J.js","assets/settings-azpzqWFZ.js","assets/sound-CVGBK-zn.js","assets/squares-oEstG12S.js","assets/stockfish-4PzBybGH.js","assets/strength-D-zbeDK2.js","assets/taxonomy-BRZgduuU.js"];
const CACHE = PREFIX + (typeof BUILD_VERSION==='string' ? BUILD_VERSION : 'development')
const INDEX = new URL('index.html', SCOPE).href
const SHELL = (typeof BUILD_SHELL!=='undefined' ? BUILD_SHELL : ['index.html']).map(file=>new URL(file,SCOPE).href)

self.addEventListener('install', (event) => {
  // Wait until existing clients close: no mixed bundle versions.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)))
})

self.addEventListener('message',event=>{if(event.data?.type==='APPLY_UPDATE')self.skipWaiting()})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    // Keep two previous shells for other open tabs that still use old hashed chunks.
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).slice(0,-2).map(key => caches.delete(key))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return
  if(new URL(request.url).searchParams.has('ribat-recover')){event.respondWith(fetch(request));return}
  const navigation = request.mode === 'navigate'
  // Standalone documents are not SPA routes: preserve their own cached content.
  const pathname = new URL(request.url).pathname
  const documentPage = pathname.endsWith('.html') && pathname !== new URL(INDEX).pathname
  const key = navigation && !documentPage ? INDEX : request
  const task = (async () => {
    const cache = await caches.open(CACHE)
    let cached = await cache.match(key)
    if(!cached && /\/assets\/[^/?]+\.(?:js|css|wasm)$/.test(request.url)){
      for(const previous of (await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE).reverse()){
        cached=await (await caches.open(previous)).match(key)
        if(cached)return {response:cached,network:Promise.resolve()}
      }
    }
    // An open client always uses one complete UI version. Do not replace
    // its index with a newer index whose lazy modules may be unavailable.
    if(cached && (navigation || SHELL.includes(request.url)))return {response:cached,network:Promise.resolve()}
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
