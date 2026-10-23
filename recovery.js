import {readDeviceBackup} from './recovery-core.js?v=20261023-cloud2'
import {recoverySession,sendRecovery,receiveRecovery} from './recovery-transfer.js?v=20261023-cloud2'
import {planDeviceRestore,applyDeviceRestore} from './recovery-restore.js?v=20261023-cloud2'

let backup=null,objectUrl=null
const status=document.querySelector('#recovery-status'),save=document.querySelector('#recovery-save'),show=document.querySelector('#recovery-show'),copy=document.querySelector('#recovery-copy'),text=document.querySelector('#recovery-text')
function refresh(){
 try {
  backup=readDeviceBackup(localStorage,location.origin)
  for(const [name,count] of Object.entries(backup.counts))document.querySelector(`[data-count="${name}"]`).textContent=count===null?'Не читается':String(count)
  status.textContent=backup.counts.groups>0?'Группы найдены. Сохраните копию перед переносом.':Object.keys(backup.entries).length?'Записи приложения найдены. Сохраните копию для проверки, даже если группы не отображаются.':'В этом окне записей не найдено. Если раньше вы работали через Telegram, откройте эту страницу кнопкой приложения в том же боте на прежнем телефоне.'
  save.disabled=show.disabled=Object.keys(backup.entries).length===0
  if(copy)copy.disabled=save.disabled
  text.hidden=true;text.value=''
 }catch{
  backup=null;save.disabled=show.disabled=true
  if(copy)copy.disabled=true
  status.textContent='Не удалось прочитать записи. Откройте приложение на прежнем телефоне, не очищая его данные.'
 }
}
document.querySelector('#recovery-refresh').addEventListener('click',refresh)
save.addEventListener('click',()=>{
 if(!backup)return
 if(objectUrl)URL.revokeObjectURL(objectUrl)
 objectUrl=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}))
 const link=document.createElement('a');link.href=objectUrl;link.download=`fikr-device-backup-${backup.createdAt.slice(0,10)}.json`;link.click()
 status.textContent='Запрошено сохранение файла. Убедитесь, что файл появился в загрузках. Если Telegram не сохраняет его, нажмите «Показать текст копии».'
})
show.addEventListener('click',()=>{if(backup){text.value=JSON.stringify(backup,null,2);text.hidden=false;text.focus();text.select()}})
copy?.addEventListener('click',async()=>{
 if(!backup)return
 const raw=JSON.stringify(backup,null,2)
 try{
  await navigator.clipboard.writeText(raw)
  status.textContent='Данные скопированы. Вернитесь в чат с помощником и вставьте их в сообщение.'
 }catch{
  text.value=raw;text.hidden=false;text.focus();text.select()
  status.textContent='Удерживайте выделенный текст, выберите «Выделить всё» → «Копировать», затем вставьте в чат с помощником.'
 }
})
refresh()

const bridge=window.Telegram?.WebApp,secret=new URLSearchParams(location.hash.slice(1)).get('restoreKey'),receive=new URLSearchParams(location.search).get('transfer')==='receive'
const transfer=document.querySelector('#recovery-transfer'),sendButton=document.querySelector('#recovery-send'),receiveButton=document.querySelector('#recovery-receive'),applyButton=document.querySelector('#recovery-apply'),cloudStatus=document.querySelector('#recovery-cloud-status'),openApp=document.querySelector('#recovery-open')
let restorePlan=null
if(transfer&&secret&&bridge?.initData&&bridge.CloudStorage&&bridge.isVersionAtLeast?.('6.9')){
 transfer.hidden=false;sendButton.hidden=receive;receiveButton.hidden=!receive
 document.querySelector('#recovery-export').hidden=receive
 document.querySelectorAll('[data-file-control]').forEach(element=>{element.hidden=true})
 status.hidden=true
 cloudStatus.textContent=receive?'Нажмите «Проверить копию». Восстановление начнётся только после вашего подтверждения.':'Нажмите «Передать копию». Ничего копировать в сообщения не потребуется.'
 if(receive){document.querySelector('h1').textContent='Восстановим ваши записи';document.querySelector('#recovery-intro').textContent='Проверим копию и сохраним её на этом устройстве. Новые записи останутся на месте.'}
 try{bridge.ready();bridge.expand()}catch{/* The data controls do not depend on expansion. */}
 sendButton.addEventListener('click',async()=>{
  sendButton.disabled=true
  try{
   refresh()
   if(!backup)throw Error('Не удалось прочитать записи.')
   if(!(backup.counts.groups>0||backup.counts.students>0))throw Error('Здесь нет групп и учеников. Откройте эту кнопку на прежнем телефоне, где вы их создавали.')
   await sendRecovery(bridge.CloudStorage,secret,backup,(at,total)=>{cloudStatus.textContent=`Передаём копию: ${at} из ${total}`})
   cloudStatus.textContent=`Копия готова: групп ${backup.counts.groups}, учеников ${backup.counts.students}. Вернитесь к помощнику и сообщите «Копия готова». Ничего копировать не нужно.`
  }catch(error){cloudStatus.textContent=error.message}
  finally{sendButton.disabled=false}
 })
 receiveButton.addEventListener('click',async()=>{
  receiveButton.disabled=true;applyButton.disabled=true;restorePlan=null
  try{
   cloudStatus.textContent='Проверяем личную копию в Telegram…'
   const incoming=await receiveRecovery(bridge.CloudStorage,secret)
   restorePlan=planDeviceRestore(localStorage,incoming)
   const counts=restorePlan.incomingCounts
   if(!(counts?.groups>0||counts?.students>0))throw Error('В копии нет групп и учеников. Пустые списки не будут восстанавливаться.')
   cloudStatus.textContent=`В копии: групп ${counts.groups}, учеников ${counts.students}. Новые записи будут сохранены. Перед переносом автоматически сохраним прежнее состояние этого устройства.`
   applyButton.hidden=false;applyButton.disabled=false
  }catch(error){cloudStatus.textContent=error.message}
  finally{receiveButton.disabled=false}
 })
 applyButton.addEventListener('click',async()=>{
  if(!restorePlan)return
  applyButton.disabled=true;receiveButton.disabled=true
  try{
   const session=await recoverySession(secret)
   applyDeviceRestore(localStorage,restorePlan,session.prefix.slice('fikr_restore_'.length))
   const result=readDeviceBackup(localStorage,location.origin)
   cloudStatus.textContent=`Записи восстановлены: групп ${result.counts.groups}, учеников ${result.counts.students}. Откройте Фикр и проверьте их.`
   openApp.hidden=false
  }catch(error){cloudStatus.textContent=error.message;receiveButton.disabled=false}
 })
}
