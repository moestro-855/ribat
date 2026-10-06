/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
const BUILD_VERSION="f1f4c422d04d861f"; const BUILD_SHELL=["index.html","theme.js","telegram.js","manifest.webmanifest","favicon.svg","assets/Book-65--r1sR.js","assets/Clock-pL6rimtC.js","assets/CompactChoice-DKZlGD3o.js","assets/Drill-B-Dzrchc.js","assets/Duo-DYFKIqNE.js","assets/Editor-Co4hj6yG.js","assets/GameCard-Cic8p0k8.js","assets/GameSearch-xqFTXEmu.js","assets/Homework-CYabmJpL.js","assets/Lab-_icM4dCM.js","assets/Loading-BKNnfsTA.js","assets/Loading-CLNoOFvU.css","assets/Play-CmvAD737.js","assets/Profile-BkKS8ujH.js","assets/Profile-PQU_8MAc.css","assets/Race-Cyu595bO.js","assets/San-CicDCser.js","assets/Sets-DzVIUhY6.js","assets/Sheet-DLJo6QMR.js","assets/Strip-8YP29u2a.js","assets/Studies-B1Pgfve2.js","assets/Studies-INVfkwWp.css","assets/Team-DaNW22gw.js","assets/archiveDiscovery-BI83mjuS.js","assets/browser-DVTTPdyi.js","assets/clock-_antc8e_.js","assets/drills-BM09lxow.js","assets/index-BgN3JCWb.css","assets/index-DrVw_IZC.js","assets/jsonDecode.worker-GvfOo3Q0.js","assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","assets/literata-greek-wght-normal-CO1l-giJ.woff2","assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","assets/literata-latin-wght-normal-DLxlUchJ.woff2","assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","assets/onest-cyrillic-wght-normal-DXI_y_WF.woff2","assets/onest-latin-ext-wght-normal-CnNj8hVb.woff2","assets/onest-latin-wght-normal-CUIqqgP9.woff2","assets/openLessonPosition-BDRr4Q6B.js","assets/photos-D9nvVEXJ.js","assets/router-JT8xo7Ur.js","assets/scrollLock-BDmSG74t.js","assets/settings-C6ha9QSk.js","assets/sound-CvzqcJRt.js","assets/squares-kuTXC7gG.js","assets/stockfish-4PzBybGH.js","assets/strength-D-zbeDK2.js","assets/taxonomy-BRZgduuU.js"];
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
  const key = navigation ? INDEX : request
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
