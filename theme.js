// Тему ставим до первой отрисовки. Если делать это из приложения, первый
// кадр рисуется системной палитрой, и часть цветов так и остаётся от неё.
//
// Отдельным файлом, а не строкой в странице: в собранной версии действует
// политика содержимого, и встроенные скрипты она запрещает.
(function () {
  try {
    var saved = localStorage.getItem('forpost.colorScheme.v1') || 'dark'
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved)
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})()
