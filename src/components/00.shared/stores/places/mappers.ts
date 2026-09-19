import type { LocalGroup, LocalPersonalMark } from './types'
import type {
  SyncGroup,
  SyncPersonalMark,
} from '@/components/00.shared/services/personal-mark/index.type'

/** Серверная метка из /sync → локальная модель. */
export function syncMarkToLocal(m: SyncPersonalMark, userId: number): LocalPersonalMark {
  return {
    id: m.id,
    userId,
    revision: m.revision,
    coordinates: m.geom.Point,
    title: m.title,
    description: m.description ?? undefined,
    category: m.category ?? undefined,
    color: m.color ?? undefined,
    icon: m.icon ?? undefined,
    isShare: m.isShare,
    isVisible: m.isVisible,
    groupsIds: m.groupsIds,
    // Фото приходят либо объектом { url }, либо просто строкой-URL — поддерживаем
    // обе формы и отсеиваем пустые/битые записи.
    photos: (m.photos ?? [])
      .map(p => (typeof p === 'string' ? p : p?.url))
      .filter((url): url is string => typeof url === 'string' && url.length > 0),
    pending: false,
  }
}

/** Серверная группа из /sync → локальная модель. */
export function syncGroupToLocal(g: SyncGroup, userId: number): LocalGroup {
  // color/icon пока не приходят в секции sync — подхватываются из create/detail.
  const extra = g as SyncGroup & { color?: string | null, icon?: string | null }
  return {
    id: g.id,
    userId,
    revision: g.revision,
    name: g.name,
    description: g.description ?? undefined,
    color: extra.color ?? undefined,
    icon: extra.icon ?? undefined,
    pending: false,
  }
}

/**
 * Слияние серверных upserted в локальный массив по id.
 * Серверная версия перетирает локальную (server-wins), кроме pending-записей —
 * их сохраняем, push подтвердит позже.
 */
export function mergeUpserted<T extends { id: number | string, pending: boolean }>(
  local: T[],
  upserted: T[],
): T[] {
  const byId = new Map<number | string, T>(local.map(item => [item.id, item]))
  for (const incoming of upserted) {
    const existing = byId.get(incoming.id)
    if (existing?.pending)
      continue
    byId.set(incoming.id, incoming)
  }
  return [...byId.values()]
}

/**
 * Merge групп: как mergeUpserted, но сохраняет локальные color/icon, если
 * секция sync их не прислала (пока бэк не отдаёт эти поля в /sync).
 */
export function mergeGroups(local: LocalGroup[], upserted: LocalGroup[]): LocalGroup[] {
  const byId = new Map<number | string, LocalGroup>(local.map(g => [g.id, g]))
  for (const incoming of upserted) {
    const existing = byId.get(incoming.id)
    if (existing?.pending)
      continue
    byId.set(incoming.id, {
      ...incoming,
      color: incoming.color ?? existing?.color,
      icon: incoming.icon ?? existing?.icon,
    })
  }
  return [...byId.values()]
}

/** Удаление серверных removed-id из локального массива (pending-записи не трогаем). */
export function applyRemoved<T extends { id: number | string, pending: boolean }>(
  local: T[],
  removed: Array<number | string>,
): T[] {
  const removedSet = new Set<number | string>(removed)
  return local.filter(item => item.pending || !removedSet.has(item.id))
}
