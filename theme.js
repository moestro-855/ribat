// Тему ставим до первой отрисовки. Если делать это из приложения, первый
// кадр рисуется системной палитрой, и часть цветов так и остаётся от неё.
//
// Отдельным файлом, а не строкой в странице: в собранной версии действует
// политика содержимого, и встроенные скрипты она запрещает.
(function () {
  try {
    var skin = localStorage.getItem('trainer.skin.v1') || 'studio'
    var skins = ['studio', 'lunar', 'sandstone', 'samarkand', 'malachite', 'night', 'walnut', 'ink', 'granat', 'cobalt', 'amethyst', 'persimmon']
    document.documentElement.setAttribute('data-skin', skins.includes(skin) ? skin : 'studio')
    document.documentElement.setAttribute('data-motion', localStorage.getItem('trainer.motion.v1') === 'reduced' ? 'reduced' : 'system')
    var saved = localStorage.getItem('forpost.colorScheme.v1') || 'dark'
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved)
    }
  } catch (e) {
    document.documentElement.setAttribute('data-skin', 'studio')
    document.documentElement.setAttribute('data-motion', 'system')
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})()
