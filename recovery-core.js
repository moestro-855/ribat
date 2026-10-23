/** Read only. Raw values are retained even if an older record cannot be decoded. */
export function readDeviceBackup(storage,source,createdAt=new Date().toISOString()) {
 const entries=Object.create(null)
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i)
  if(key?.startsWith('trainer.')){
   const raw=storage.getItem(key)
   if(raw!==null)entries[key]=raw
  }
 }
 const counts={}
 for(const [label,key] of Object.entries({groups:'trainer.groups.v1',students:'trainer.students.v1',lessons:'trainer.sets.v1',journal:'trainer.marks.v1'})){
  const raw=entries[key]
  try {const value=raw===undefined?[]:JSON.parse(raw);counts[label]=Array.isArray(value)?value.length:null}
  catch {counts[label]=null}
 }
 return {format:'fikr-device-backup',version:1,createdAt,source,counts,entries}
}
