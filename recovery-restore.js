const PREFIX='trainer.'
const arrays=new Set(['groups','students','sets','marks','assignments','puzzles','tours','puzzle.visits'])
const maps=new Set(['progress','lines','spot','advice'])
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key)
const goodId=id=>typeof id==='string'&&id.length>0&&id.length<500&&!['__proto__','constructor','prototype'].includes(id)
function parsed(raw,key){try{return JSON.parse(raw)}catch{throw Error('Не удалось прочитать запись '+key+'. Исходные данные сохранены.')}}
function mergeRows(current,incoming,name){
 if(!Array.isArray(current)||!Array.isArray(incoming)||current.length+incoming.length>100000)throw Error('Неверный список: '+name)
 if(name==='tours'){
  if([...current,...incoming].some(value=>typeof value!=='string'))throw Error('Неверный список турниров.')
  return [...new Set([...current,...incoming])]
 }
 if(name==='puzzle.visits')return current.length?current:incoming
 for(const rows of [current,incoming]){
  const ids=new Set()
  for(const row of rows){
   if(!object(row)||!goodId(row.id)||ids.has(row.id))throw Error('Повторяющаяся или неверная запись: '+name)
   ids.add(row.id)
   if(['groups','students','sets'].includes(name)&&(typeof row.name!=='string'||row.name.length>1000||!Number.isFinite(row.createdAt)))throw Error('Неверная карточка: '+name)
   if(name==='groups'&&(!Array.isArray(row.studentIds)||row.studentIds.some(id=>!goodId(id))))throw Error('Неверный состав группы.')
   if(name==='sets'&&(!Array.isArray(row.puzzleIds)||row.puzzleIds.some(id=>!goodId(id))))throw Error('Неверный урок.')
   if(['marks','assignments'].includes(name)&&(!goodId(row.studentId)||!goodId(row.setId)||!Number.isFinite(row.at)))throw Error('Неверная запись журнала.')
   if(name==='puzzles'&&(typeof row.fen!=='string'||!Array.isArray(row.solution)))throw Error('Неверная авторская задача.')
  }
 }
 const result=new Map(current.map(row=>[row.id,row]))
 for(const row of incoming){
  const existing=result.get(row.id)
  if(!existing)result.set(row.id,row)
  else if(name==='groups')result.set(row.id,{...existing,studentIds:[...new Set([...existing.studentIds,...row.studentIds])]})
 }
 return [...result.values()]
}
function mergeValue(key,current,incoming){
 const name=key.slice(PREFIX.length).replace(/\.v\d+$/,'')
 if(arrays.has(name))return JSON.stringify(mergeRows(current===null?[]:parsed(current,key),parsed(incoming,key),name))
 if(maps.has(name)){
  const old=parsed(incoming,key),now=current===null?{}:parsed(current,key)
  if(!object(old)||!object(now))throw Error('Неверные данные: '+name)
  const merged={...old,...now}
  if(name==='progress')for(const [id,value] of Object.entries(old)){if(!goodId(id)||!object(value)||!['solved','failed','peeked'].includes(value.outcome)||!Number.isFinite(value.at))throw Error('Неверная отметка задачи.');if(!own(now,id)||value.at>(now[id]?.at??0))merged[id]=value}
  return JSON.stringify(merged)
 }
 if(name==='skill'){
  const old=parsed(incoming,key),now=current===null?null:parsed(current,key)
  if(!object(old)||!Number.isFinite(old.attempts))throw Error('Неверная запись прогресса.')
  return !now||Number(now.attempts??0)===0?incoming:current
 }
 if(name==='race'){
  const old=parsed(incoming,key),now=current===null?null:parsed(current,key)
  if(!object(old)||!Number.isFinite(old.goal)||!object(old.round)||!Array.isArray(old.wins))throw Error('Неверная запись наград.')
  return !now||(Array.isArray(now.wins)&&now.wins.length===0&&now.round?.m===1&&now.round?.f===1)?incoming:current
 }
 return current===null||current===''?incoming:current
}
export function planDeviceRestore(storage,backup){
 if(!object(backup)||backup.format!=='fikr-device-backup'||backup.version!==1||!object(backup.entries))throw Error('Эта копия не подходит для Фикра.')
 const changes=[];let bytes=0
 for(const [key,incoming] of Object.entries(backup.entries)){
  if(key.startsWith('trainer.index.'))continue
  if(!key.startsWith(PREFIX)||key.length>300||Array.from(key).some(char=>char.charCodeAt(0)<32)||typeof incoming!=='string')throw Error('Неверный ключ в копии.')
  bytes+=new TextEncoder().encode(incoming).length
  if(bytes>8*1024*1024)throw Error('Копия слишком велика.')
  const before=storage.getItem(key),after=mergeValue(key,before,incoming)
  if(after!==before)changes.push({key,before,after})
 }
 const incomingCounts={}
 for(const [name,key] of Object.entries({groups:'trainer.groups.v1',students:'trainer.students.v1'})){
  const value=own(backup.entries,key)?parsed(backup.entries[key],key):[]
  if(!Array.isArray(value))throw Error('Неверный список: '+name)
  incomingCounts[name]=value.length
 }
 return {changes,createdAt:new Date().toISOString(),incomingCounts}
}
export function applyDeviceRestore(storage,plan,session){
 if(!/^[a-f0-9]{20}$/.test(session))throw Error('Неверный сеанс восстановления.')
 for(const change of plan.changes)if(storage.getItem(change.key)!==change.before)throw Error('Записи изменились в другом окне. Закройте его и снова проверьте копию.')
 if(!plan.changes.length)return {changed:0}
 const backupKey='fikr.restore.before.'+session
 if(storage.getItem(backupKey)!==null)throw Error('Эта копия уже применялась. Повторная запись остановлена.')
 storage.setItem(backupKey,JSON.stringify({format:'fikr-before-restore',createdAt:plan.createdAt,entries:Object.fromEntries(plan.changes.map(row=>[row.key,row.before]))}))
 const done=[]
 try{
  for(const change of plan.changes){storage.setItem(change.key,change.after);done.push(change);if(storage.getItem(change.key)!==change.after)throw Error('Проверка записи не пройдена.')}
 }catch{
  let restored=true
  for(const change of done.reverse())try{if(change.before===null)storage.removeItem(change.key);else storage.setItem(change.key,change.before)}catch{restored=false}
  throw Error(restored?'Не хватило места или доступ к памяти ограничен. Прежние записи восстановлены; копия в Telegram сохранена.':'Перенос прерван. Сохранена копия прежних записей; обратитесь к помощнику.')
 }
 return {changed:done.length,backupKey}
}
