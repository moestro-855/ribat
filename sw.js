/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
// Explicitly withdrawn generated-human/animal/figurative covers: never revive them from older caches.
const WITHDRAWN_COVERS = ["dubai-2021-duel-editorial-v5.webp","astana-2023-duel-editorial-v5.webp","singapore-2024-duel-editorial-v3.webp","london-2018-duel-editorial-v3.webp","new-york-2016-duel-editorial-v4.webp","sochi-2014-duel-editorial-v3.webp","chennai-2013-duel-editorial-v3.webp","moscow-2012-duel-editorial-v3.webp","london-classical-2000-duel-editorial-v3.webp","brissago-2004-duel-editorial-v3.webp","elista-2006-duel-editorial-v3.webp","bonn-2008-duel-editorial-v3.webp","sofia-2010-duel-editorial-v3.webp","new-york-2016-editorial-v3.webp","gallery-moscow-2012-editorial-v2.webp","bonn-2008-editorial-v2.webp","mexico-2007-eight-contenders-editorial-v4.webp","san-luis-2005-editorial-v2.webp","tripoli-2004-editorial-v2.webp","moscow-winter-2002-editorial-v2.webp","delhi-tehran-2000-editorial-v2.webp","las-vegas-1999-editorial-v2.webp","new-york-pca-1995-editorial-v2.webp","netherlands-jakarta-1993-editorial-v2.webp","london-pca-1993-editorial-v2.webp","moscow-knight-1985-editorial-v2.webp","baguio-1978-editorial-v2.webp","reykjavik-1972-editorial-v2.webp","moscow-1969-editorial-v2.webp","moscow-1966-editorial-v2.webp","moscow-1960-editorial-v2.webp","alekhine-1934-editorial-v2.webp","buenos-aires-1927-editorial-v2.webp","berlin-1910-restrained-king-editorial-v4.webp","germany-1908-editorial-v2.webp","havana-1889-editorial-v2.webp","moscow-marathon-1984-editorial-v2.webp","alekhine-1929-editorial-v2.webp","hague-moscow-1948-new-king-editorial-v4.webp","groningen-fide-1997-editorial-v2.webp","london-classical-2000-editorial-v2.webp","moscow-1896-rematch-kings-editorial-v4.webp","moscow-1961-editorial-v2.webp","chennai-2013-editorial-v2.webp","baden-baden-1925-knight-corridor-editorial-v4.webp","baku-1961-bishop-knight-editorial-v4.webp","bastia-2007-knight-corridor-editorial-v4.webp"]
const withdrawnCover = url => new URL(url).pathname.startsWith(new URL('tourcovers/',SCOPE).pathname) && WITHDRAWN_COVERS.includes(new URL(url).pathname.split('/').pop())
const BUILD_VERSION="a0cca43ae136b125"; const BUILD_SHELL=["index.html","legal.html","theme.js","telegram.js","startup.js","manifest.webmanifest","favicon.svg","assets/Book-BefMOjIB.js","assets/Clock-D2CcTAHi.js","assets/CompactChoice-DdZURGKf.js","assets/Drill-A71kwgFy.js","assets/Duo-BWS9zQTb.js","assets/Editor-4cZmdlhK.js","assets/GameSearch-CkMSIpAa.js","assets/Homework-DyYLsYYO.js","assets/Lab-DgXXJwO1.js","assets/Loading-7E3wtNwg.css","assets/Loading-CfH8r2hl.js","assets/Play-C-vSa6Wu.js","assets/PositionDatabase-5GSLoy7F.js","assets/Profile-Dmozu5PZ.js","assets/Profile-PQU_8MAc.css","assets/Race-N0F3HkWV.js","assets/San-DKpCC7tB.js","assets/Sets-Qp5unvAO.js","assets/Sheet-BGfcqyqx.js","assets/Studies-Cld-vU7G.js","assets/Studies-INVfkwWp.css","assets/Team-BZLwPM4l.js","assets/Tourney-SVXdt-Yq.js","assets/annotationAlignment-sNV6MHcS.js","assets/archiveDiscovery-XdX2lNIq.js","assets/browser-DVTTPdyi.js","assets/clock-_antc8e_.js","assets/drills-WBcyW9oM.js","assets/index-CllTDmDQ.css","assets/index-bbuzpD4G.js","assets/jsonDecode.worker-GvfOo3Q0.js","assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","assets/literata-greek-wght-normal-CO1l-giJ.woff2","assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","assets/literata-latin-wght-normal-DLxlUchJ.woff2","assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","assets/onest-cyrillic-wght-normal-DXI_y_WF.woff2","assets/onest-latin-ext-wght-normal-CnNj8hVb.woff2","assets/onest-latin-wght-normal-CUIqqgP9.woff2","assets/openLessonPosition-CKyiBWjH.js","assets/photos-DjYekt-q.js","assets/reviewedCommentIndex-CY85Ckqo.json","assets/settings-Za8XBSw4.js","assets/sound-BsTfrQaQ.js","assets/squares-DWCXVeDr.js","assets/stockfish-4PzBybGH.js","assets/strength-D-zbeDK2.js","assets/taxonomy-BRZgduuU.js"];
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
    .then(async keys => {
      const scoped=keys.filter(key=>key.startsWith(PREFIX))
      await Promise.all(scoped.map(async key=>{
        const cache=await caches.open(key)
        await Promise.all(WITHDRAWN_COVERS.map(name=>cache.delete(new URL('tourcovers/'+name,SCOPE).href,{ignoreSearch:true})))
      }))
      await Promise.all(scoped.filter(key=>key!==CACHE).slice(0,-2).map(key=>caches.delete(key)))
    })
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return
  if(withdrawnCover(request.url)){event.respondWith(Promise.resolve(new Response('',{status:410,headers:{'Cache-Control':'no-store'}})));return}
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
