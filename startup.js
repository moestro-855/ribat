/* Entry-module recovery must work even when React itself cannot start. */
;(function () {
  var key = 'ribat:entry-recovery'
  var waited = false
  function dismissSplash() {
    var splash=document.getElementById('boot-splash')
    if(!splash)return
    splash.setAttribute('aria-hidden','true')
    splash.classList.add('boot-splash--closing')
    splash.addEventListener('transitionend',function(){splash.remove()},{once:true})
  }
  document.addEventListener('ribat:mounted',dismissSplash,{once:true})
  function empty() { var root=document.getElementById('root');return root && !root.hasChildNodes() }
  async function recover() {
    if (!empty() || document.visibilityState === 'hidden') return
    var root=document.getElementById('root')
    var destination=new URL(location.href)
    destination.searchParams.set('ribat-recover','1')
    var recent=false
    try {recent=Date.now()-Number(sessionStorage.getItem(key))<60000} catch {}
    if (!recent && !destination.searchParams.has('ribat-entry-retry')) {
      try {
        var response=await fetch(new URL('index.html?ribat-recover=1',location.href),{cache:'no-store',signal:AbortSignal.timeout(5000)})
        if(response.ok) {
          try {sessionStorage.setItem(key,String(Date.now()))} catch {}
          destination.searchParams.set('ribat-entry-retry','1')
          location.replace(destination.href);return
        }
      } catch {}
    }
    if(!empty())return
    var panel=document.createElement('div'),text=document.createElement('p'),button=document.createElement('button')
    panel.style.cssText='padding:24px;color:inherit;font:16px system-ui;text-align:center'
    text.textContent='Не удалось открыть приложение. Твои сохранения не удалены.'
    button.textContent='Повторить загрузку';button.onclick=function(){destination.searchParams.delete('ribat-entry-retry');location.replace(destination.href)}
    dismissSplash();panel.append(text,button);root.append(panel)
  }
  setTimeout(function(){waited=true;void recover()},12000)
  document.addEventListener('visibilitychange',function(){if(waited&&document.visibilityState==='visible')void recover()})
})();
