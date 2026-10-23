import {readDeviceBackup} from './recovery-core.js'

let backup=null,objectUrl=null
const status=document.querySelector('#recovery-status'),save=document.querySelector('#recovery-save'),show=document.querySelector('#recovery-show'),text=document.querySelector('#recovery-text')
function refresh(){
 try {
  backup=readDeviceBackup(localStorage,location.origin)
  for(const [name,count] of Object.entries(backup.counts))document.querySelector(`[data-count="${name}"]`).textContent=count===null?'Не читается':String(count)
  status.textContent=backup.counts.groups>0?'Группы найдены. Сохраните копию перед переносом.':Object.keys(backup.entries).length?'Записи приложения найдены. Сохраните копию для проверки, даже если группы не отображаются.':'В этом окне записей не найдено. Если раньше вы работали через Telegram, откройте эту страницу кнопкой приложения в том же боте на прежнем телефоне.'
  save.disabled=show.disabled=Object.keys(backup.entries).length===0
  text.hidden=true;text.value=''
 }catch{
  backup=null;save.disabled=show.disabled=true
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
refresh()
