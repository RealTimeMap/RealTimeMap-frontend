/** Параметры запроса синхронизации */
export interface PersonalSyncParams {
  /** Ревизия последней успешной синхронизации (если не передать — загрузятся все активные записи) */
  since?: number
  /** Лимит записей в каждой секции (1-500, по умолчанию 100) */
  limit?: number
}

/** Фотография внутри ответа синхронизации: объект { url } либо просто строка-URL. */
export type SyncPhoto
  = | { url: string, mimeType?: string }
    | string

/** Координаты точки в формате [longitude, latitude] */
export interface SyncPointGeom {
  Point: [number, number]
}

/** Персональная метка в секции синхронизации */
export interface SyncPersonalMark {
  id: number
  revision: number
  title: string
  description?: string | null
  category?: string | null
  color?: string | null
  icon?: string | null
  isShare: boolean
  isVisible: boolean
  groupsIds: string[]
  photos: SyncPhoto[]
  geom: SyncPointGeom
}

/** Группа меток в секции синхронизации */
export interface SyncGroup {
  // uuid группы
  id: string
  revision: number
  name: string
  description?: string | null
}

/** Обобщенный тип секции изменений */
export interface SyncSection<T> {
  /** Добавленные или измененные сущности */
  upserted: T[]
  /** ID удаленных сущностей (метки — number, группы — uuid) */
  removed: Array<number | string>
  /** Курсор секции */
  cursor: number
  /** Есть ли еще данные для догрузки */
  hasMore: boolean
}

export interface PersonalSyncResponse {
  sections: {
    personalMarks: SyncSection<SyncPersonalMark>
    groups: SyncSection<SyncGroup>
  }
  /** Глобальный курсор для следующего запроса (since = cursor) */
  cursor: number
  /** Флаг, указывающий, нужно ли делать повторный запрос за следующей пачкой */
  hasMore: boolean
  /** Целевая ревизия */
  updateTo: number
}

export interface GeoPoint {
  lon: number
  lat: number
}

export interface PersonalMark {
  id: number
  userId: number
  revision: number
  geom: GeoPoint
  title: string
  description?: string
  category: string
  color: string
  icon: string
  isShare: boolean
  isVisible: boolean
  groupsIds: string[]
  photos?: string[]
  createdAt: string
  updatedAt: string
}

export interface PersonalMarkMutationResult {
  id: number
  userId: number
  revision: number
}

export interface CreatePersonalMarkPayload {
  title: string
  description?: string
  category: string
  icon: string
  color: string
  isVisible?: boolean
  longitude: number
  latitude: number
  groupsIds: string[]
  photos?: File[] | Blob[]
}

/** Тело запроса на частичное обновление метки (PATCH) */
export interface UpdatePersonalMarkPayload {
  title?: string
  description?: string
  category?: string
  icon?: string
  color?: string
  isVisible?: boolean
  /** Координаты передаются только парой */
  longitude?: number
  latitude?: number
  /** Заменяет состав групп целиком, если передан */
  groupsIds?: string[]
  /** Новые прикрепляемые фотографии (добавляются к существующим) */
  photos?: File[] | Blob[]
  /** URL фотографий, которые нужно удалить (суммарно не более 3) */
  photosToDelete?: string[]
}
