export function formatLastSeen(iso?: string): string {
  if (!iso)
    return 'не в сети'

  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1)
    return 'был(а) в сети только что'
  if (diffMin < 60)
    return `был(а) в сети ${diffMin} мин назад`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24)
    return `был(а) в сети ${diffHours} ч назад`

  const date = new Date(iso)
  const isYesterday = diffHours < 48 && date.getDate() !== new Date().getDate()
  if (isYesterday)
    return `был(а) в сети вчера в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`

  return `был(а) в сети ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
}
