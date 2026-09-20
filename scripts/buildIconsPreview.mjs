// Генерирует icons/preview.html — витрину локальных анимированных иконок
// (icons/*.json). Запуск: node scripts/buildIconsPreview.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(scriptDir, '..', 'icons')

// Человекочитаемые названия для иконок достижений (ключ → подпись).
const TITLES = {
  'trophy-loop': 'Кубок',
  'medal-loop': 'Медаль',
  'star-loop': 'Звезда',
  'crown-loop': 'Корона',
  'flame-loop': 'Серия',
  'target-loop': 'Цель',
  'rocket-loop': 'Прогресс',
  'compass-loop': 'Исследователь',
  'map-pin-star-loop': 'Мастер меток',
  'route-loop': 'Путешественник',
  'flag-loop': 'Первопроходец',
  'heart-loop': 'Любимые места',
  'people-loop': 'Сообщество',
  'bolt-loop': 'Энергия',
  'gem-loop': 'Редкое',
  'gift-loop': 'Награда',
  'calendar-loop': 'Регулярность',
  'camera-loop': 'Фотограф',
  'globe-loop': 'Весь мир',
  'levelup-loop': 'Новый уровень',
  'map-loop': 'Карта',
  'places-loop': 'Места',
  'chat-loop': 'Чаты',
  'profile-loop': 'Профиль',
  'layers-loop': 'Слои',
  'admin-loop': 'Админ',
  'plus': 'Плюс',
  'minus': 'Минус',
  'locate-loop': 'Геолокация',
  'settings': 'Настройки',
  'edit': 'Редактор',
  'chevron-right': 'Шеврон',
  'close': 'Закрыть',
  'check': 'Галочка',
  'copy': 'Копировать',
  'eye': 'Показать',
  'eye-off': 'Скрыть',
  'cloud-check': 'Синхр. готово',
  'cloud-upload': 'Синхр. ожидает',
  'folder': 'Папка',
  'lock': 'Замок',
  'pin': 'Метка',
  'pin-wave': 'На карте',
  'note': 'Заметка',
  'trash': 'Удалить',
  'add-circle': 'Добавить',
  'unlink': 'Открепить',
  'list-check': 'Список',
}

const cards = []

if (existsSync(iconsDir)) {
  for (const file of readdirSync(iconsDir).filter(f => f.endsWith('.json'))) {
    const coll = JSON.parse(readFileSync(join(iconsDir, file), 'utf8'))
    const { prefix, width = 24, height = 24, icons = {} } = coll
    for (const [name, icon] of Object.entries(icons)) {
      const w = icon.width ?? width
      const h = icon.height ?? height
      const full = `${prefix}:${name}`
      const title = TITLES[name] ?? name
      cards.push(`
      <figure class="card" tabindex="0">
        <div class="icon">
          <svg viewBox="0 0 ${w} ${h}" width="56" height="56" aria-hidden="true">${icon.body}</svg>
        </div>
        <figcaption>
          <span class="title">${title}</span>
          <code class="code" title="нажмите, чтобы скопировать">${full}</code>
        </figcaption>
      </figure>`)
    }
  }
}

const html = `<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Иконки проекта — превью</title>
<style>
  :root {
    --bg: #101014; --panel: #1b2029; --text: #e9ecef; --muted: #8a93a2;
    --border: rgba(255,255,255,.1); --accent: #973bff;
  }
  :root[data-theme="light"] {
    --bg: #f7f8fc; --panel: #fff; --text: #10131a; --muted: #6b7280;
    --border: rgba(16,19,26,.1); --accent: #7c3aed;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    padding: 24px 16px 60px;
  }
  header {
    max-width: 960px; margin: 0 auto 24px; display: flex;
    align-items: center; gap: 16px; flex-wrap: wrap;
  }
  h1 { font-size: 20px; margin: 0; flex: 1; }
  .controls { display: flex; gap: 8px; align-items: center; }
  .controls button, .swatch {
    cursor: pointer; border: 1px solid var(--border); background: var(--panel);
    color: var(--text); border-radius: 10px; padding: 8px 12px; font-size: 13px;
  }
  .swatches { display: flex; gap: 6px; }
  .swatch { width: 26px; height: 26px; padding: 0; border-radius: 50%; }
  .swatch[data-active="1"] { outline: 2px solid var(--text); outline-offset: 1px; }
  .grid {
    max-width: 960px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;
  }
  .card {
    margin: 0; background: var(--panel); border: 1px solid var(--border);
    border-radius: 16px; padding: 18px 12px 14px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .icon { color: var(--accent); display: grid; place-items: center; height: 64px; }
  figcaption { display: flex; flex-direction: column; gap: 4px; width: 100%; min-width: 0; }
  .title { font-size: 14px; font-weight: 600; }
  .code {
    font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--muted);
    cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .code.copied { color: var(--accent); }
  .count { color: var(--muted); font-size: 13px; }
</style>
</head>
<body>
  <header>
    <h1>Иконки проекта <span class="count">· ${cards.length}</span></h1>
    <div class="controls">
      <div class="swatches" id="swatches"></div>
      <button id="theme">Светлая</button>
    </div>
  </header>
  <div class="grid">${cards.join('')}</div>
<script>
  const root = document.documentElement
  const themeBtn = document.getElementById('theme')
  themeBtn.addEventListener('click', () => {
    const light = root.getAttribute('data-theme') === 'light'
    root.setAttribute('data-theme', light ? 'dark' : 'light')
    themeBtn.textContent = light ? 'Светлая' : 'Тёмная'
  })

  const colors = ['#973bff', '#3399ff', '#16a34a', '#eab308', '#ff5a5f', '#ec4899', '#e9ecef']
  const sw = document.getElementById('swatches')
  colors.forEach((c, i) => {
    const b = document.createElement('button')
    b.className = 'swatch'; b.style.background = c
    if (i === 0) b.dataset.active = '1'
    b.addEventListener('click', () => {
      root.style.setProperty('--accent', c)
      sw.querySelectorAll('.swatch').forEach(s => s.removeAttribute('data-active'))
      b.dataset.active = '1'
    })
    sw.appendChild(b)
  })

  document.querySelectorAll('.code').forEach((el) => {
    el.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(el.textContent)
        el.classList.add('copied')
        setTimeout(() => el.classList.remove('copied'), 900)
      } catch {}
    })
  })
</script>
</body>
</html>
`

writeFileSync(join(iconsDir, 'preview.html'), html)
console.log(`icons/preview.html: ${cards.length} иконок`)
