/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
const BUILD_VERSION="f948932f3f2be020"; const BUILD_SHELL=["index.html","legal.html","theme.js","telegram.js","startup.js","manifest.webmanifest","favicon.svg","assets/Book-CzkKtS6r.js","assets/Clock-DOhMra5R.js","assets/CompactChoice-DdZURGKf.js","assets/Drill-Bw1n9BJh.js","assets/Duo-C8stSEIf.js","assets/Editor-BOl8rtV1.js","assets/GameSearch-D7uKVrcr.js","assets/Homework-BFW1KX5r.js","assets/Lab-D8bGQXSP.js","assets/Loading-7E3wtNwg.css","assets/Loading-CfH8r2hl.js","assets/Play-4QioC0-L.js","assets/PositionDatabase-DWwPUhHW.js","assets/Profile-DwL-CaHK.js","assets/Profile-PQU_8MAc.css","assets/Race-Y9GOEqmR.js","assets/San-DKpCC7tB.js","assets/Sets-Dss8J6vJ.js","assets/Sheet-BGfcqyqx.js","assets/Studies-CLAg_5Ah.js","assets/Studies-INVfkwWp.css","assets/Team-B-_LLkIR.js","assets/Tourney-CHlpU7zC.js","assets/annotationAlignment-sNV6MHcS.js","assets/archiveDiscovery-BXAR53-G.js","assets/browser-DVTTPdyi.js","assets/clock-_antc8e_.js","assets/drills-WBcyW9oM.js","assets/index-DjvNjdQh.css","assets/index-NGmwHUQy.js","assets/jsonDecode.worker-GvfOo3Q0.js","assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","assets/literata-greek-wght-normal-CO1l-giJ.woff2","assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","assets/literata-latin-wght-normal-DLxlUchJ.woff2","assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","assets/onest-cyrillic-wght-normal-DXI_y_WF.woff2","assets/onest-latin-ext-wght-normal-CnNj8hVb.woff2","assets/onest-latin-wght-normal-CUIqqgP9.woff2","assets/openLessonPosition-CKyiBWjH.js","assets/photos-Cxp3NgES.js","assets/reviewedCommentIndex-CY85Ckqo.json","assets/settings-Za8XBSw4.js","assets/sound-BsTfrQaQ.js","assets/squares-DWCXVeDr.js","assets/stockfish-4PzBybGH.js","assets/strength-D-zbeDK2.js","assets/taxonomy-BRZgduuU.js"];
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
  const codeAsset = /\/assets\/[^/?]+\.(?:js|css|wasm)$/.test(request.url)
  const valid = response => !codeAsset || !response?.headers.get('content-type')?.includes('text/html')
  const task = (async () => {
    const cache = await caches.open(CACHE)
    let cached = await cache.match(key)
    if(cached && !valid(cached))cached=undefined
    if(!cached && codeAsset){
      for(const previous of (await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE).reverse()){
        cached=await (await caches.open(previous)).match(key)
        if(cached && valid(cached))return {response:cached,network:Promise.resolve()}
        cached=undefined
      }
    }
    // An open client always uses one complete UI version. Do not replace
    // its index with a newer index whose lazy modules may be unavailable.
    if(cached && (navigation || SHELL.includes(request.url)))return {response:cached,network:Promise.resolve()}
    const network = fetch(request).then(async response => {
      // A static host may serve the SPA HTML for a removed hash. Never cache
      // that as executable code: it would poison later offline starts.
      if(!valid(response))return cached ?? Response.error()
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
