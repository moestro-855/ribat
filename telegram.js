/*
 * Приложение внутри Телеграма.
 *
 * «Рибат» открывается по обычному адресу в браузере и точно так же — кнопкой
 * бота. Во втором случае Телеграм подкладывает свой мостик (telegram-web-app.js)
 * и ждёт двух вещей: сказать, что мы готовы, и попросить окно во весь экран.
 * Без этого приложение висит на половине высоты, и до нижних кнопок не
 * дотянуться.
 *
 * Всё остальное трогать не нужно: тема у нас своя, тёмная, и подстраиваться
 * под телеграмовскую не надо — иначе шахматная доска поедет по цвету.
 *
 * Файл лежит рядом с приложением и грузится и вне Телеграма — тогда моста
 * нет, и он просто ничего не делает.
 */
;(function () {
  var bridge = window.Telegram && window.Telegram.WebApp
  if (!bridge) return

  document.documentElement.classList.add('в-телеграме')

  try {
    bridge.ready()
    bridge.expand()
    // Свайп вниз внутри приложения закрывал окно на середине партии.
    if (bridge.disableVerticalSwipes) bridge.disableVerticalSwipes()
    if (bridge.setHeaderColor) bridge.setHeaderColor('#070b17')
    if (bridge.setBackgroundColor) bridge.setBackgroundColor('#070b17')
  } catch (error) {
    // Старые версии клиента не знают части вызовов — это не повод падать.
  }
})()
