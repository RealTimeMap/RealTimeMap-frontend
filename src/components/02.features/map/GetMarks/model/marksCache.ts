import type { Cluster, Mark } from '@/components/00.shared/services/mark/index.type'
import { Preferences } from '@capacitor/preferences'
import { createIdbStore } from '@/components/00.shared/lib/idbStore'

export interface MarksArea {
  marks: Mark[]
  clusters: Cluster[]
}

/** Последние просмотренные области карты для офлайна. Старые вытесняются — хранилище не растёт. */
const store = createIdbStore({
  store: 'marks',
  maxEntries: 40,
  maxAgeMs: 7 * 24 * 60 * 60 * 1000,
})

const LAST_AREA_KEY = 'last'

export function readMarksArea(key: string): Promise<MarksArea | undefined> {
  return store.read<MarksArea>(key)
}

/** Без сети и без точного совпадения по области показываем последнюю увиденную. */
export function readLastMarksArea(): Promise<MarksArea | undefined> {
  return store.read<MarksArea>(LAST_AREA_KEY)
}

export function writeMarksArea(key: string, area: MarksArea): void {
  store.write(key, area)
  store.write(LAST_AREA_KEY, area)
}

// --- Разовая уборка старого кэша ---
// Раньше каждая область писалась в Preferences под своим ключом и никогда не удалялась:
// на Android SharedPreferences целиком читается при старте и со временем тормозит запуск.
const LEGACY_PREFIX = 'map_cache_'
const LEGACY_LAST_KEY = 'map_last_visible_marks'
const MIGRATED_KEY = 'rtm_marks_cache_v2'

let purgeStarted = false

export async function purgeLegacyMarksCache(): Promise<void> {
  if (purgeStarted)
    return
  purgeStarted = true
  try {
    const { value } = await Preferences.get({ key: MIGRATED_KEY })
    if (value === 'true')
      return
    const { keys } = await Preferences.keys()
    const legacy = keys.filter(key => key.startsWith(LEGACY_PREFIX) || key === LEGACY_LAST_KEY)
    await Promise.all(legacy.map(key => Preferences.remove({ key })))
    await Preferences.set({ key: MIGRATED_KEY, value: 'true' })
  }
  catch (e) {
    console.warn('[marksCache] Не удалось убрать старый кэш меток', e)
  }
}
