const MAX_BYTES=8*1024*1024,CHUNK=3000
const encode=bytes=>{let text='';for(const byte of bytes)text+=String.fromCharCode(byte);return btoa(text)}
const decode=text=>Uint8Array.from(atob(text),char=>char.charCodeAt(0))
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
export async function recoverySession(secret){
 if(!/^[A-Za-z0-9_-]{43}$/.test(secret))throw Error('Нет ключа переноса. Откройте кнопку в боте.')
 const bytes=decode(secret.replaceAll('-','+').replaceAll('_','/')+'=')
 if(bytes.length!==32)throw Error('Неверный ключ переноса.')
 return {key:await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']),prefix:'fikr_restore_'+(await hash(bytes)).slice(0,20)}
}
function call(cloud,method,...args){return new Promise((resolve,reject)=>{
 let finished=false
 const timer=setTimeout(()=>{if(!finished){finished=true;reject(Error('Telegram не ответил. Проверьте соединение и повторите.'))}},20000)
 const done=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);if(error)reject(Error('Telegram не сохранил копию. Повторите передачу.'));else resolve(value)}
 try{cloud[method](...args,done)}catch{done(true)}
})}
export async function sendRecovery(cloud,secret,backup,onProgress=()=>{}){
 const clean={...backup,entries:Object.fromEntries(Object.entries(backup.entries).filter(([key])=>!key.startsWith('trainer.index.')))}
 const session=await recoverySession(secret),raw=new TextEncoder().encode(JSON.stringify(clean))
 if(raw.length>MAX_BYTES)throw Error('Копия слишком велика для переноса.')
 let packed=raw,compressed=false
 if(typeof CompressionStream!=='undefined'){packed=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());compressed=true}
 const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},session.key,packed)),text=encode(cipher)
 const parts=Array.from({length:Math.ceil(text.length/CHUNK)},(_,i)=>text.slice(i*CHUNK,(i+1)*CHUNK))
 if(parts.length>900)throw Error('Копия слишком велика для переноса.')
 const keys=parts.map((_,i)=>session.prefix+'_p'+i)
 for(let i=0;i<parts.length;i++){await call(cloud,'setItem',keys[i],parts[i]);onProgress(i+1,parts.length)}
 const checked=await call(cloud,'getItems',keys)
 if(keys.some((key,i)=>checked[key]!==parts[i]))throw Error('Копия передалась не полностью. Повторите передачу.')
 const meta={version:1,count:parts.length,iv:encode(iv),sha256:await hash(cipher),rawBytes:raw.length,compressed,createdAt:backup.createdAt}
 const metaText=JSON.stringify(meta)
 if(await call(cloud,'setItem',session.prefix+'_meta',metaText)!==true||await call(cloud,'getItem',session.prefix+'_meta')!==metaText)throw Error('Telegram не подтвердил сохранение копии. Повторите передачу.')
 return {parts:parts.length,bytes:raw.length}
}
export async function receiveRecovery(cloud,secret){
 const session=await recoverySession(secret),metaRaw=await call(cloud,'getItem',session.prefix+'_meta')
 if(!metaRaw)throw Error('Копия ещё не передана. Сначала нажмите «Передать копию» на прежнем телефоне.')
 let meta;try{meta=JSON.parse(metaRaw)}catch{throw Error('Не удалось прочитать описание копии.')}
 if(meta.version!==1||!Number.isInteger(meta.count)||meta.count<1||meta.count>900||!Number.isInteger(meta.rawBytes)||meta.rawBytes<1||meta.rawBytes>MAX_BYTES||typeof meta.compressed!=='boolean'||!/[a-f0-9]{64}/.test(meta.sha256))throw Error('Описание копии повреждено.')
 const keys=Array.from({length:meta.count},(_,i)=>session.prefix+'_p'+i),parts=await call(cloud,'getItems',keys)
 if(keys.some(key=>typeof parts[key]!=='string'||!parts[key]||parts[key].length>CHUNK))throw Error('Копия неполная. Передайте её ещё раз с прежнего телефона.')
 const cipher=decode(keys.map(key=>parts[key]).join(''))
 if(await hash(cipher)!==meta.sha256)throw Error('Проверка копии не пройдена. Записи не изменены.')
 let packed;try{packed=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(meta.iv)},session.key,cipher)}catch{throw Error('Ключ не подходит к копии. Записи не изменены.')}
 let raw=new Uint8Array(packed)
 if(meta.compressed){
  if(typeof DecompressionStream==='undefined')throw Error('Для восстановления обновите Telegram.')
  const reader=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let size=0
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>meta.rawBytes||size>MAX_BYTES)throw Error('Размер копии не совпадает.');chunks.push(part.value)}}finally{await reader.cancel().catch(()=>{})}
  raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length}
 }
 if(raw.length!==meta.rawBytes)throw Error('Размер копии не совпадает.')
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))
}
