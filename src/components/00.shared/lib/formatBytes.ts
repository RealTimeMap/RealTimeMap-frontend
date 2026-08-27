export function formatBytes(bytes: number): string {
  if (bytes <= 0)
    return '0 Б'

  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** i

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
