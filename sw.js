/* Cache only this application's scope; never remove another site's data. */
const SCOPE = new URL('./', self.location.href).href
const PREFIX = 'ribat:' + SCOPE + ':'
// Explicitly withdrawn generated-human/animal/figurative covers: never revive them from older caches.
const WITHDRAWN_COVERS = ["dubai-2021-duel-editorial-v5.webp","astana-2023-duel-editorial-v5.webp","singapore-2024-duel-editorial-v3.webp","london-2018-duel-editorial-v3.webp","new-york-2016-duel-editorial-v4.webp","sochi-2014-duel-editorial-v3.webp","chennai-2013-duel-editorial-v3.webp","moscow-2012-duel-editorial-v3.webp","london-classical-2000-duel-editorial-v3.webp","brissago-2004-duel-editorial-v3.webp","elista-2006-duel-editorial-v3.webp","bonn-2008-duel-editorial-v3.webp","sofia-2010-duel-editorial-v3.webp","new-york-2016-editorial-v3.webp","gallery-moscow-2012-editorial-v2.webp","bonn-2008-editorial-v2.webp","mexico-2007-eight-contenders-editorial-v4.webp","san-luis-2005-editorial-v2.webp","tripoli-2004-editorial-v2.webp","moscow-winter-2002-editorial-v2.webp","delhi-tehran-2000-editorial-v2.webp","las-vegas-1999-editorial-v2.webp","new-york-pca-1995-editorial-v2.webp","netherlands-jakarta-1993-editorial-v2.webp","london-pca-1993-editorial-v2.webp","moscow-knight-1985-editorial-v2.webp","baguio-1978-editorial-v2.webp","reykjavik-1972-editorial-v2.webp","moscow-1969-editorial-v2.webp","moscow-1966-editorial-v2.webp","moscow-1960-editorial-v2.webp","alekhine-1934-editorial-v2.webp","buenos-aires-1927-editorial-v2.webp","berlin-1910-restrained-king-editorial-v4.webp","germany-1908-editorial-v2.webp","havana-1889-editorial-v2.webp","moscow-marathon-1984-editorial-v2.webp","alekhine-1929-editorial-v2.webp","hague-moscow-1948-new-king-editorial-v4.webp","groningen-fide-1997-editorial-v2.webp","london-classical-2000-editorial-v2.webp","moscow-1896-rematch-kings-editorial-v4.webp","moscow-1961-editorial-v2.webp","chennai-2013-editorial-v2.webp","baden-baden-1925-knight-corridor-editorial-v4.webp","baku-1961-bishop-knight-editorial-v4.webp","bastia-2007-knight-corridor-editorial-v4.webp","biel-1976-lakeside-knight-editorial-v4.webp","biel-2007-comeback-knight-editorial-v4.webp","budapest-1952-memorial-knight-editorial-v4.webp","denver-1971-knight-pressure-editorial-v4.webp","karlsbad-1929-blockading-knight-editorial-v4.webp","khanty-2007-enduring-knight-editorial-v4.webp","leningrad-1947-knight-bishop-editorial-v4.webp","london-1983-knight-initiative-editorial-v4.webp","montreal-2006-prepared-knight-editorial-v4.webp","moscow-1957-attacking-knight-editorial-v4.webp","moscow-1967-knight-breakthrough-editorial-v4.webp","moscow-1971-two-knights-editorial-v4.webp","moscow-1983-knight-breakthrough-editorial-v4.webp","new-york-2006-resolute-knight-editorial-v4.webp","novgorod-1995-queen-knight-initiative-editorial-v4.webp","novgorod-1996-birch-knight-editorial-v4.webp","poikovsky-2004-equal-knights-editorial-v4.webp","roquebrune-amber-1992-knight-initiative-editorial-v4.webp","rostov-1971-rooks-knight-editorial-v4.webp","sanghi-nagar-1995-knight-outpost-editorial-v4.webp","taiyuan-2007-leading-knight-editorial-v4.webp","tbilisi-1966-knight-queen-editorial-v4.webp","tbilisi-1977-emerging-knight-editorial-v4.webp","tbilisi-1981-final-knight-editorial-v4.webp","valjevo-2007-equal-knights-editorial-v4.webp","vidmar-1997-knight-junction-editorial-v4.webp","vilnius-1984-knight-bishop-editorial-v4.webp","vitoria-2007-topalov-resolute-knight-editorial-v4.webp","zandvoort-1936-rising-knight-editorial-v4.webp","zurich-1959-two-knights-editorial-v4.webp","quebec-1989-knight-endurance-editorial-v4.webp"]
const withdrawnCover = url => new URL(url).pathname.startsWith(new URL('tourcovers/',SCOPE).pathname) && WITHDRAWN_COVERS.includes(new URL(url).pathname.split('/').pop())
const WITHDRAWN_AWARD_PATHS = ['themes','days','fast','guess','tactic','played','rank','studied'].map(name=>'art/awards/'+name+'.webp')
const withdrawnAward = url => WITHDRAWN_AWARD_PATHS.some(path => new URL(url).pathname === new URL(path,SCOPE).pathname)
const WITHDRAWN_BOOK_PATHS = ['covers/ботвинник-таль-матч-на-перв-мира-1960.webp','covers/ботвинник-смыслов-матч-на-перв-мира-1954.webp','covers/ботвинник-смыслов-матч-на-перв-мира-1958.webp','covers/алехин-капабланка-матч-на-перв-мира-1927.webp','covers/бронштейн-международный-турнир-гроссмейстеров-цюрих-.webp','covers/аврух-защита-грюнфельда.webp','covers/белявский-михальчишин-интуиция.webp','covers/верховский-в-бой-вступают-ладьи.webp','covers/верховский-в-бой-идут-пешки.webp','covers/верховский-цугцванг-преимущество-двух-слонов.webp','covers/book-375055f2f7e6-thematic-v3.webp','covers/волчок-уроки-шахматной-тактики.webp','covers/дворецкий-шбч-позиционная-игра-том-4.webp']
WITHDRAWN_BOOK_PATHS.push('covers/book-c4c58b4fe8d7-thematic-v3.webp','covers/book-d772023a0fad-thematic-v3.webp')
WITHDRAWN_BOOK_PATHS.push('covers/kotov-thinking-branches-book-v2.webp','covers/book-09febe79f8e3-thematic-v3.webp')
const withdrawnBook = url => WITHDRAWN_BOOK_PATHS.some(path => new URL(url).pathname === new URL(path,SCOPE).pathname)
const BUILD_VERSION="d81fb6ac656fa5bd"; const BUILD_SHELL=["index.html","legal.html","theme.js","telegram.js","startup.js","boot.css","art/interface/fikr-emblem-mask-256.png","manifest.webmanifest","favicon.svg","assets/Book-BJfwHHTp.js","assets/Clock-CeBhf_-d.js","assets/CompactChoice-elhijksu.js","assets/Drill-DnslF7IS.js","assets/Duo-Bd65gi4i.js","assets/Editor-D_qLixfS.js","assets/GameSearch-nAZ6PBY3.js","assets/Homework-DwF4NH6L.js","assets/Lab-CLmBKF2j.js","assets/Loading-B7ifAtHu.css","assets/Loading-C-DJqRmH.js","assets/Play-QceexykJ.js","assets/PositionDatabase--XUyGXcv.js","assets/Profile-B8UVxQrA.js","assets/Profile-PQU_8MAc.css","assets/Race-Dpmg_jmf.js","assets/San-e-FUftit.js","assets/Sets-XzQVbhe5.js","assets/Sheet-BniO4WaU.js","assets/Studies-Boi672EL.js","assets/Studies-INVfkwWp.css","assets/Team-C-KYzR3j.js","assets/Tourney-p4fTNwUw.js","assets/annotationAlignment-sNV6MHcS.js","assets/appActivity-CJaLI46Q.js","assets/archiveSection-DAD1v1xu.js","assets/browser-DVTTPdyi.js","assets/clock-_antc8e_.js","assets/drills-iAZApHXO.js","assets/index-BxE4nVQu.css","assets/index-Z3MXF2SE.js","assets/jsonDecode.worker-GvfOo3Q0.js","assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","assets/literata-greek-wght-normal-CO1l-giJ.woff2","assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","assets/literata-latin-wght-normal-DLxlUchJ.woff2","assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","assets/onest-cyrillic-wght-normal-DXI_y_WF.woff2","assets/onest-latin-ext-wght-normal-CnNj8hVb.woff2","assets/onest-latin-wght-normal-CUIqqgP9.woff2","assets/openLessonPosition-CiVuHXtg.js","assets/photos-XKIk3Ysx.js","assets/reviewedCommentIndex-qBf_BkPY.json","assets/settings-BDDZ14tg.js","assets/sound-S3d-b2zd.js","assets/squares-DNuNqKpP.js","assets/stockfish-CWUv4lVA.js","assets/strength-D-zbeDK2.js","assets/taxonomy-BRZgduuU.js"];
const CACHE = PREFIX + (typeof BUILD_VERSION==='string' ? BUILD_VERSION : 'development')
// Downloaded books/artwork outlive UI releases. Never prune this as an old shell.
const RUNTIME = PREFIX + 'runtime'
const INDEX = new URL('index.html', SCOPE).href
const SHELL = (typeof BUILD_SHELL!=='undefined' ? BUILD_SHELL : ['index.html']).map(file=>new URL(file,SCOPE).href)

self.addEventListener('install', (event) => {
  // Wait until existing clients close: no mixed bundle versions.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)))
})

self.addEventListener('message',event=>{
  if(event.data?.type==='APPLY_UPDATE')self.skipWaiting()
  if(event.data?.type!=='CACHE_VISITED'||!Array.isArray(event.data.urls)||!event.source?.url?.startsWith(SCOPE))return
  event.waitUntil((async()=>{
    const cache=await caches.open(RUNTIME)
    const urls=[...new Set(event.data.urls.filter(value=>typeof value==='string'))].slice(0,256)
    await Promise.all(urls.map(async value=>{
      let url
      try { url=new URL(value) } catch { return }
      if(!url.href.startsWith(SCOPE))return
      const path=url.pathname.slice(new URL(SCOPE).pathname.length)
      // No API endpoints, credentials, arbitrary documents or executable code.
      if(!/^(?:covers\/index\.json|data\/.+\.json(?:\.gz)?|(?:covers|tourcovers|citycovers|photos|art)\/.+\.(?:webp|png|jpe?g))$/i.test(path))return
      if(withdrawnCover(url.href)||withdrawnAward(url.href)||withdrawnBook(url.href))return
      try {
        if(await cache.match(url.href))return
        const response=await fetch(url.href)
        if(response.ok&&!response.headers.get('content-type')?.includes('text/html'))await cache.put(url.href,response)
      } catch { /* Offline/quota failure never removes an existing readable copy. */ }
    }))
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    // Keep two previous shells for other open tabs that still use old hashed chunks.
    .then(async keys => {
      const scoped=keys.filter(key=>key.startsWith(PREFIX))
      await Promise.all(scoped.map(async key=>{
        const cache=await caches.open(key)
        await Promise.all(WITHDRAWN_COVERS.map(name=>cache.delete(new URL('tourcovers/'+name,SCOPE).href,{ignoreSearch:true})))
        await Promise.all(WITHDRAWN_AWARD_PATHS.map(path=>cache.delete(new URL(path,SCOPE).href,{ignoreSearch:true})))
        await Promise.all(WITHDRAWN_BOOK_PATHS.map(path=>cache.delete(new URL(path,SCOPE).href,{ignoreSearch:true})))
      }))
      await Promise.all(scoped.filter(key=>key!==CACHE&&key!==RUNTIME).slice(0,-2).map(key=>caches.delete(key)))
    })
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return
  if(withdrawnCover(request.url)||withdrawnAward(request.url)||withdrawnBook(request.url)){event.respondWith(Promise.resolve(new Response('',{status:410,headers:{'Cache-Control':'no-store'}})));return}
  if(new URL(request.url).searchParams.has('ribat-recover')){event.respondWith(fetch(request));return}
  const navigation = request.mode === 'navigate'
  // Standalone documents are not SPA routes: preserve their own cached content.
  const pathname = new URL(request.url).pathname
  const documentPage = pathname.endsWith('.html') && pathname !== new URL(INDEX).pathname
    const key = navigation && !documentPage ? INDEX : request
  const shellAsset = SHELL.includes(request.url)
  // JSON modules, bootstrap scripts, fonts and the loader mask are part of the
  // installed UI too. Looking only in RUNTIME strands a fresh offline start.
  const codeAsset = /\/assets\/[^/?]+\.(?:js|css|wasm|json)$/.test(request.url)
  const valid = response => !codeAsset || !response?.headers.get('content-type')?.includes('text/html')
  const task = (async () => {
    const cache = await caches.open(navigation||documentPage||codeAsset||shellAsset ? CACHE : RUNTIME)
    let cached = await cache.match(key)
    if(cached && !valid(cached))cached=undefined
    // Runtime data/artwork may have been downloaded before the last update.
    // Keep it reachable offline across the retained cache generations too.
    if(!cached){
      for(const previous of (await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE).reverse()){
        cached=await (await caches.open(previous)).match(key)
        if(cached && valid(cached)){
          if(codeAsset)return {response:cached,network:Promise.resolve()}
          try { await cache.put(key,cached.clone()) } catch { /* Keep the readable old copy. */ }
          break
        }
        cached=undefined
      }
    }
    // An open client always uses one complete UI version. Do not replace
    // its index with a newer index whose lazy modules may be unavailable.
    if(cached && (navigation || shellAsset))return {response:cached,network:Promise.resolve()}
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
