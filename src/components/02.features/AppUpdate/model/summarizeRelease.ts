const FALLBACK_DESCRIPTION = 'Установите новую версию приложения для стабильной работы.'

/** Сколько пунктов показываем в уведомлении, остальное сворачиваем в счётчик */
const MAX_ITEMS = 3

/** Секция с заметками, которые автор релиза написал руками (`Release-note:` в коммите) */
const HIGHLIGHTS_SECTION = /Что нового|Highlights/i

/** Секция с новой функциональностью — запасной источник, если заметок нет */
const FEATURES_SECTION = /Функциональность|Features/i

/**
 * Заголовки секций changelog, интересные пользователю, и их короткие подписи.
 * Служебные разделы (рефакторинг, CI, сборка, контрибьюторы) в уведомление
 * не попадают — там нужен минимум.
 */
const SECTION_LABELS: [RegExp, string][] = [
  [FEATURES_SECTION, 'Новых функций'],
  [/Исправлени|Fixes/i, 'Исправлений'],
  [/Производительность|Performance/i, 'Ускорений'],
  [/Обновлени/i, 'Обновлений'],
  [/Новое/i, 'Новшеств'],
  [/Стили/i, 'Правок интерфейса'],
]

/** `- **core:** Добавил чаты ([236b60b](https://…))` → `Добавил чаты` */
function cleanItem(line: string): string {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^\*\*[^*]+\*\*:?\s*/, '')
    .replace(/\s*\(\[[^\]]+\]\([^)]+\)\)$/, '')
    .trim()
}

function joinItems(items: string[], total: number): string {
  const shown = items.slice(0, MAX_ITEMS).join(', ')
  const rest = total - Math.min(items.length, MAX_ITEMS)

  return rest > 0 ? `${shown} и ещё ${rest}` : shown
}

/**
 * Тело GitHub Release — это полный changelog со списком коммитов и ссылками
 * (несколько килобайт). В уведомлении он выглядит стеной текста, поэтому
 * сворачиваем его до одной строки, выбирая самый человеческий из источников:
 *
 * 1. секция «Что нового» — заметки, написанные руками через `Release-note:`;
 * 2. темы feat-коммитов, если заметок не было;
 * 3. счётчики по разделам — если и тем нет.
 */
export function summarizeRelease(body?: string): string {
  if (!body?.trim())
    return FALLBACK_DESCRIPTION

  const counts = new Map<string, number>()
  const highlights: string[] = []
  const features: string[] = []

  let currentLabel: string | null = null
  let currentBucket: string[] | null = null
  let hasBreaking = false

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim()

    const heading = line.match(/^#{2,4}\s+(\S.*)$/)
    if (heading) {
      const title = heading[1]

      if (/breaking|ломающ|⚠/i.test(title))
        hasBreaking = true

      currentLabel = SECTION_LABELS.find(([pattern]) => pattern.test(title))?.[1] ?? null

      if (HIGHLIGHTS_SECTION.test(title))
        currentBucket = highlights
      else if (FEATURES_SECTION.test(title))
        currentBucket = features
      else
        currentBucket = null

      continue
    }

    if (!/^[-*]\s+/.test(line))
      continue

    if (currentLabel)
      counts.set(currentLabel, (counts.get(currentLabel) ?? 0) + 1)

    if (currentBucket) {
      const text = cleanItem(line)
      if (text)
        currentBucket.push(text)
    }
  }

  const totalChanges = [...counts.values()].reduce((sum, count) => sum + count, 0)

  const summary = highlights.length
    ? joinItems(highlights, highlights.length)
    : features.length
      ? joinItems(features, totalChanges)
      : [...counts].map(([label, count]) => `${label}: ${count}`).join(' · ')

  if (!summary)
    return hasBreaking ? 'Есть несовместимые изменения' : FALLBACK_DESCRIPTION

  return hasBreaking
    ? `${summary}. Есть несовместимые изменения`
    : summary
}
