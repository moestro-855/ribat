/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
const BUILD_VERSION="d8812bb2d9a0e5f6"; const BUILD_SHELL=["index.html","theme.js","telegram.js","manifest.webmanifest","favicon.svg","assets/Book-BqqEqmxZ.js","assets/Clock-xj_aRehB.js","assets/CompactChoice-C1RAE6uW.js","assets/Drill-8BJ6oQkI.js","assets/Duo-wtLs1EPQ.js","assets/Editor-Cq8E9Iz0.js","assets/GameCard-8p4Sej9T.js","assets/GameSearch-DRaK1HjV.js","assets/Homework-eJcY9X5U.js","assets/Lab-556__1pk.js","assets/Play-CyYnhvMB.js","assets/Profile-Be5jbZaK.js","assets/Profile-PQU_8MAc.css","assets/Race-B0xANuyR.js","assets/San-3g3euJ5i.js","assets/Sets-D-NReIkf.js","assets/Sheet-BHcy5lwM.js","assets/Strip-D5kMLc2E.js","assets/Studies-DcvBAXkE.js","assets/Studies-INVfkwWp.css","assets/Team-CBJoJ8Nd.js","assets/browser-DVTTPdyi.js","assets/clock-_antc8e_.js","assets/drills-DilLZhxb.js","assets/index-DVAEnQU-.js","assets/index-DWTgd-zI.css","assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","assets/literata-greek-wght-normal-CO1l-giJ.woff2","assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","assets/literata-latin-wght-normal-DLxlUchJ.woff2","assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","assets/onest-cyrillic-wght-normal-DXI_y_WF.woff2","assets/onest-latin-ext-wght-normal-CnNj8hVb.woff2","assets/onest-latin-wght-normal-CUIqqgP9.woff2","assets/photos-Wj6q3Jt4.js","assets/router-Db9umz7W.js","assets/scrollLock-BnAy49Gi.js","assets/settings-Cfu8al75.js","assets/share-CMYeMp2l.js","assets/shelves-9-2IZKi_.js","assets/sound-Cgip2zXq.js","assets/squares-XD7-GXvJ.js","assets/stockfish-vKUde7Fi.js","assets/strength-D-zbeDK2.js","assets/taxonomy-CHFjFljC.js"];
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
