export function formatRelativeDate(
  dateString: string,
  prefix = 'добавил(а)',
) {
  if (!dateString)
    return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime()))
    return '—'

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffSeconds < 60)
    return `${prefix} только что`

  const rtf = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'always' })

  const minutes = Math.floor(diffSeconds / 60)
  if (minutes < 60)
    return `${prefix} ${rtf.format(-minutes, 'minute')}`

  const hours = Math.floor(minutes / 60)
  if (hours < 24)
    return `${prefix} ${rtf.format(-hours, 'hour')}`

  const days = Math.floor(hours / 24)
  if (days < 30)
    return `${prefix} ${rtf.format(-days, 'day')}`

  const months = Math.floor(days / 30)
  if (months < 12)
    return `${prefix} ${rtf.format(-months, 'month')}`

  const years = Math.floor(days / 365)
  return `${prefix} ${rtf.format(-years, 'year')}`
}
