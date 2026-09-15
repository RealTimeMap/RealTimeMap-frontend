import type { LocalGroup, LocalPersonalMark, Mutation } from './types'
import { Preferences } from '@capacitor/preferences'

const KEYS = {
  marks: 'pm_personal_marks',
  groups: 'pm_groups',
  queue: 'pm_mutation_queue',
  cursor: 'pm_sync_cursor',
  version: 'pm_cache_version',
} as const

/**
 * Версия локального кэша. Повышаем, когда прежний формат данных мог сохраниться
 * повреждённым и требуется одноразовый полный ре-pull с сервера.
 * v2: фикс потери фото (sync отдаёт string[], раньше парсилось как {url}).
 * v3: очистка меток с legacy null-элементами в photos, сохранёнными до фикса v2.
 */
const CACHE_VERSION = 3

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key })
  if (!value)
    return fallback
  try {
    return JSON.parse(value) as T
  }
  catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): Promise<void> {
  return Preferences.set({ key, value: JSON.stringify(value) })
}

/**
 * Единая точка доступа к локальному персисту раздела «Места».
 * Инкапсулирует Preferences, чтобы при росте объёмов заменить бэкенд хранилища.
 */
export const placesStorage = {
  loadMarks: () => readJson<LocalPersonalMark[]>(KEYS.marks, []),
  saveMarks: (marks: LocalPersonalMark[]) => writeJson(KEYS.marks, marks),

  loadGroups: () => readJson<LocalGroup[]>(KEYS.groups, []),
  saveGroups: (groups: LocalGroup[]) => writeJson(KEYS.groups, groups),

  loadQueue: () => readJson<Mutation[]>(KEYS.queue, []),
  saveQueue: (queue: Mutation[]) => writeJson(KEYS.queue, queue),

  async loadCursor(): Promise<number | undefined> {
    const { value } = await Preferences.get({ key: KEYS.cursor })
    return value ? Number(value) : undefined
  },
  saveCursor: (cursor: number) => Preferences.set({ key: KEYS.cursor, value: String(cursor) }),

  /**
   * Одноразовая миграция по версии кэша. При устаревшей версии сбрасывает cursor,
   * чтобы следующий sync сделал полный pull и переписал повреждённые данные
   * (очередь мутаций при этом сохраняется). Возвращает true, если сброс выполнен.
   */
  async migrate(): Promise<boolean> {
    const { value } = await Preferences.get({ key: KEYS.version })
    if (Number(value) === CACHE_VERSION)
      return false
    await Preferences.remove({ key: KEYS.cursor })
    await Preferences.set({ key: KEYS.version, value: String(CACHE_VERSION) })
    return true
  },

  async clear(): Promise<void> {
    await Promise.all(Object.values(KEYS).map(key => Preferences.remove({ key })))
  },
}
