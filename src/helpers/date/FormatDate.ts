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
