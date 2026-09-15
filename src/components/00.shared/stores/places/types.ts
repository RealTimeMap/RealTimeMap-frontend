import type {
  CreateGroupPayload,
  Group,
  UpdateGroupPayload,
} from '@/components/00.shared/services/group/index.type'
import type {
  CreatePersonalMarkPayload,
  UpdatePersonalMarkPayload,
} from '@/components/00.shared/services/personal-mark/index.type'

/** Идентификатор сущности: number для серверных, string (uuid) для локальных офлайн. */
export type EntityId = number | string

/** Признак ещё не подтверждённой сервером сущности. */
export interface OfflineMeta {
  /** true — есть несинхронизированные изменения (сидит в очереди мутаций). */
  pending: boolean
  /** Локальный uuid, пока не получен серверный id (для create-офлайн). */
  localId?: string
}

/** Личная метка в локальном сторе (серверные поля + офлайн-мета). */
export interface LocalPersonalMark extends OfflineMeta {
  id: EntityId
  userId: number
  revision: number
  /** Координаты в формате MapPoint: [lon, lat]. */
  coordinates: [number, number]
  title: string
  description?: string
  category?: string
  color?: string
  icon?: string
  isShare: boolean
  isVisible: boolean
  groupsIds: number[]
  /** URL уже загруженных фото (сервер) + локальные file://-пути (офлайн). */
  photos: string[]
  createdAt?: string
  updatedAt?: string
}

/** Группа в локальном сторе. */
export interface LocalGroup extends OfflineMeta {
  id: EntityId
  userId: number
  revision: number
  name: string
  description?: string
  color?: string
  icon?: string
  createdAt?: string
}

/** Локально снятое фото, ждущее отправки (путь в Filesystem). */
export interface PendingPhoto {
  /** Путь внутри Directory.Data. */
  path: string
  mimeType: string
}

/** Операция в очереди синхронизации. */
export type Mutation
  = | { id: string, kind: 'mark.create', localId: string, payload: CreatePersonalMarkPayload, photos: PendingPhoto[] }
    | { id: string, kind: 'mark.update', target: EntityId, payload: UpdatePersonalMarkPayload, photos: PendingPhoto[] }
    | { id: string, kind: 'mark.delete', target: EntityId }
    | { id: string, kind: 'group.create', localId: string, payload: CreateGroupPayload }
    | { id: string, kind: 'group.update', target: EntityId, payload: UpdateGroupPayload }
    | { id: string, kind: 'group.delete', target: EntityId }

export type MutationKind = Mutation['kind']

/** Реэкспорт серверных payload-типов для удобства. */
export type {
  CreateGroupPayload,
  CreatePersonalMarkPayload,
  Group,
  UpdateGroupPayload,
  UpdatePersonalMarkPayload,
}
