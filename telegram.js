/*
 * Приложение внутри Телеграма.
 *
 * «Рибат» открывается по обычному адресу в браузере и точно так же — кнопкой
 * бота. Во втором случае Телеграм подкладывает свой мостик
 * (telegram-web-app.js) и ждёт от приложения нескольких вещей. Без них
 * пользоваться нельзя: окно висит на половине высоты, свайп вниз закрывает
 * его посреди партии, а системная кнопка «назад» выбрасывает наружу вместо
 * того, чтобы вернуть на прошлый экран.
 *
 * Файл грузится и вне Телеграма — тогда моста нет, и он просто ничего не
 * делает.
 */
;(function () {
  var initialized=false
  function initialize() {
  var bridge = window.Telegram && window.Telegram.WebApp
  if (!bridge||initialized) return
  initialized=true

  document.documentElement.classList.add('в-телеграме')

  function safely(work) {
    try {
      work()
    } catch (error) {
      /* старые клиенты не знают части вызовов — это не повод падать */
    }
  }

  safely(function () {
    bridge.ready()
    if (bridge.isExpanded !== true) bridge.expand()
    // Свайп вниз внутри приложения закрывал окно на середине партии.
    if (bridge.disableVerticalSwipes) bridge.disableVerticalSwipes()
    if (bridge.setHeaderColor) bridge.setHeaderColor('#070b17')
    if (bridge.setBackgroundColor) bridge.setBackgroundColor('#070b17')
  })

  /*
   * Кнопка «назад».
   *
   * На телефоне системная кнопка закрывала приложение целиком: Телеграм
   * отдаёт её себе и историю страницы не смотрит. Своя кнопка в шапке
   * Телеграма решает это правильно — она ведёт на прошлый экран, а не
   * наружу. Показываем её везде, кроме корня: на корне выход — это и
   * правда выход.
   *
   * Глубину считает роутер и помечает ею запись истории (router.ts), так
   * что здесь достаточно её прочитать.
   */
  function depth() {
    var state = history.state
    return state && typeof state.depth === 'number' ? state.depth : 0
  }

  function sync() {
    safely(function () {
      if (!bridge.BackButton) return
      if (depth() > 0) bridge.BackButton.show()
      else bridge.BackButton.hide()
      // На корне случайный системный свайп не должен выкидывать молча.
      if (bridge.enableClosingConfirmation) bridge.enableClosingConfirmation()
    })
  }

  safely(function () {
    if (bridge.BackButton && bridge.BackButton.onClick) {
      bridge.BackButton.onClick(function () {
        if (depth() > 0) history.back()
        else {
          location.hash = '#/'
        }
      })
    }
  })

  window.addEventListener('hashchange', sync)
  window.addEventListener('popstate', sync)
  sync()

  /*
   * Возвращение из сна.
   *
   * Возвращение может сопровождаться несколькими событиями сразу. Нельзя
   * безусловно просить нативное окно развернуться на каждом focus: ответ
   * хоста сам может принести новый focus. Размеры восстанавливаем без
   * повторного входа; уже развёрнутое окно вообще не трогаем.
   */
  var waking=false, lastExpand=-Infinity
  function wake(activated) {
    if (waking) return
    if (activated !== true && document.visibilityState !== 'visible') return
    waking=true
    try {
      safely(function () {
        var now=Date.now(), elapsed=now-lastExpand
        if (bridge.isExpanded !== true && (elapsed>=1000 || elapsed<0)) {
          // Record BEFORE crossing the native bridge, including synchronous
          // or delayed focus feedback while isExpanded still reports false.
          lastExpand=now
          bridge.expand()
        }
      })
      window.dispatchEvent(new Event('resize'))
    } finally { waking=false }
  }

  // A real hide is stronger than SDK isActive: locking the phone does not
  // necessarily minimise the Mini App. Only a subsequent host activation may
  // temporarily override stale hidden visibility for newly opened resources.
  function sleep() { window.__ribatTelegramAwake=false }
  function suspendWindow() { sleep(); lastExpand=-Infinity }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') suspendWindow()
    else { sleep(); wake() }
  })
  document.addEventListener('freeze', suspendWindow)
  window.addEventListener('pagehide', suspendWindow)
  window.addEventListener('blur', sleep)
  window.addEventListener('pageshow', wake)
  window.addEventListener('focus', wake)
  // A new-window link is not reliable inside a Telegram WebView.
  document.addEventListener('click', function (event) {
    var anchor = event.target && event.target.closest && event.target.closest('a[href]')
    if (!anchor || !bridge.openTelegramLink) return
    if (!/^https:\/\/t\.me\//.test(anchor.href)) return
    try { bridge.openTelegramLink(anchor.href); event.preventDefault() } catch { /* ordinary link remains available */ }
  })
  // Telegram activation is independent of browser visibility on some clients.
  safely(function () {
    bridge.onEvent('deactivated', function () { suspendWindow(); window.dispatchEvent(new Event('ribat:deactivated')) })
    bridge.onEvent('activated', function () {
      window.__ribatTelegramAwake=true
      wake(true)
      window.dispatchEvent(new Event('ribat:activated'))
    })
  })
  safely(function () {
    if (bridge.onEvent) {
      bridge.onEvent('viewportChanged', function () {
        window.dispatchEvent(new Event('resize'))
      })
    }
  })
  window.dispatchEvent(new Event('ribat:bridge-ready'))
  }
  var sdk=document.getElementById('telegram-sdk')
  if(sdk)sdk.addEventListener('load',initialize,{once:true})
  initialize()
})()
