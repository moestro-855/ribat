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
  var bridge = window.Telegram && window.Telegram.WebApp
  if (!bridge) return

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
    bridge.expand()
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
   * После блокировки экрана приложение зависало: Телеграм сворачивает окно
   * в половину высоты, размеры пересчитаны для старого окна, и доска
   * оказывается за краем — со стороны это выглядит как «повисло». Просим
   * окно обратно и заставляем разметку пересчитаться.
   */
  function wake() {
    if (document.visibilityState !== 'visible') return
    safely(function () {
      bridge.expand()
      if (bridge.disableVerticalSwipes) bridge.disableVerticalSwipes()
    })
    // Пересчёт размеров: без события многие блоки остаются с прежними.
    window.dispatchEvent(new Event('resize'))
  }

  document.addEventListener('visibilitychange', wake)
  window.addEventListener('pageshow', wake)
  window.addEventListener('focus', wake)
  safely(function () {
    if (bridge.onEvent) {
      bridge.onEvent('viewportChanged', function () {
        window.dispatchEvent(new Event('resize'))
      })
    }
  })
})()
