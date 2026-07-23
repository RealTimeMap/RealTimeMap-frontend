/**
 * Время в формате ЧЧ:ММ — для отметки на сообщении
 * @param dateString Дата в ISO 8601
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime()))
    return ''

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Подпись разделителя дня в ленте сообщений: «Сегодня», «Вчера» или «5 июля»
 * @param dateString Дата в ISO 8601
 */
export function formatDayLabel(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime()))
    return ''

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (isSameDay(date, today))
    return 'Сегодня'
  if (isSameDay(date, yesterday))
    return 'Вчера'

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== today.getFullYear() && { year: 'numeric' }),
  }).format(date)
}

/**
 * Короткая отметка времени для строки списка чатов:
 * сегодня — «12:34», вчера — «Вчера», раньше — «5 июл»
 * @param dateString Дата в ISO 8601
 */
export function formatChatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime()))
    return ''

  const label = formatDayLabel(dateString)

  if (label === 'Сегодня')
    return formatTime(dateString)
  if (label === 'Вчера')
    return label

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

/**
 * Склоняет существительные в зависимости от числительного
 * @param count Число
 * @param titles Массив склонений [один, два, пять] -> ['день', 'дня', 'дней']
 */
export function pluralize(count: number, titles: [string, string, string]): string {
  const rules = new Intl.PluralRules('ru-RU')
  const result = rules.select(count)

  switch (result) {
    case 'one':
      return `${count} ${titles[0]}`
    case 'few':
      return `${count} ${titles[1]}`
    default:
      return `${count} ${titles[2]}`
  }
}
