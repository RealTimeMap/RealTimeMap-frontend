import type { Cluster, Mark } from '@/components/00.shared/services/mark/index.type'

/** Показанные за сессию метки: «удиви» не повторяется, пока есть из чего выбрать. */
const shown: number[] = []
/** Серверу хватает последних — длинный список раздувал бы запрос. */
const EXCLUDE_LIMIT = 50

export function remember(id: number) {
  if (!shown.includes(id))
    shown.push(id)
}

export function excludeParam(): string | undefined {
  return shown.length ? shown.slice(-EXCLUDE_LIMIT).join(',') : undefined
}

function weighted<T>(items: T[], weight: (item: T) => number): T | null {
  const total = items.reduce((sum, item) => sum + weight(item), 0)
  let roll = Math.random() * total
  for (const item of items) {
    roll -= weight(item)
    if (roll <= 0)
      return item
  }
  return items[items.length - 1] ?? null
}

/** Случайная метка из загруженных: с фото вдвое вероятнее — открывать её интереснее. */
export function pickMark(marks: Mark[], current: number | null): Mark | null {
  const others = marks.filter(mark => mark.id !== current)
  const fresh = others.filter(mark => !shown.includes(mark.id))
  return weighted(fresh.length ? fresh : others, mark => mark.photos?.length ? 2 : 1)
}

/** Когда карта отдалена: кластер, где меток больше, вероятнее. */
export function pickCluster(clusters: Cluster[]): Cluster | null {
  return weighted(clusters, cluster => cluster.count)
}
