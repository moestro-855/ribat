/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
const BUILD_VERSION="d37f00d0f63f9745"; const BUILD_SHELL=["index.html","theme.js","telegram.js","manifest.webmanifest","favicon.svg","assets/Book-B-0zD8Ar.js","assets/Clock-DTKiCiIH.js","assets/CompactChoice-B6DKtxYv.js","assets/Drill-BZU_Zk0X.js","assets/Duo-3Stpq2VU.js","assets/Editor-Bufbe4Bw.js","assets/GameCard-D4cjfJqQ.js","assets/GameSearch-C7G8el9C.js","assets/Homework-CkeoTwAf.js","assets/Lab-BGl6zOhj.js","assets/Play-N-iTrURK.js","assets/Profile-DXZMDYYW.js","assets/Profile-PQU_8MAc.css","assets/Race-BXNRQ431.js","assets/San-BWFWfo_7.js","assets/Sets-CASXb0U9.js","assets/Sheet-BsljU3bn.js","assets/Strip-BLAc2RMM.js","assets/Studies-CJYnn80_.js","assets/Studies-INVfkwWp.css","assets/Team-CoWP_ULm.js","assets/browser-DVTTPdyi.js","assets/clock-_antc8e_.js","assets/drills-C2WN4ETO.js","assets/index-BNXF33G6.js","assets/index-C-gThg-5.css","assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","assets/literata-greek-wght-normal-CO1l-giJ.woff2","assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","assets/literata-latin-wght-normal-DLxlUchJ.woff2","assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","assets/onest-cyrillic-wght-normal-DXI_y_WF.woff2","assets/onest-latin-ext-wght-normal-CnNj8hVb.woff2","assets/onest-latin-wght-normal-CUIqqgP9.woff2","assets/openLessonPosition-B349ceEg.js","assets/photos-BHeCLpGB.js","assets/router-Br2qfeeM.js","assets/scrollLock-CCRQKiFe.js","assets/settings-ldjB10-m.js","assets/shelves-9-2IZKi_.js","assets/sound-fBE7aD7A.js","assets/squares-PrIYEQzq.js","assets/stockfish-Eu-xfDTu.js","assets/strength-D-zbeDK2.js","assets/taxonomy-hdIRc2LJ.js"];
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
