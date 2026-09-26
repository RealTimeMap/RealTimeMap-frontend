// --- Коллекция достопримечательностей ---
// Карточка места открывается, когда вы рядом. Пока открытые хранятся на устройстве;
// с бэкендом сюда придёт загрузка и сохранение, интерфейс останется тем же

/** Ближе этого карточка открывается, м. */
export const UNLOCK_RADIUS = 150
const STORAGE_KEY = 'rtm_landmarks_unlocked'

function read(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, number>
  }
  catch {
    return {}
  }
}

/** id места → когда открыто, мс. */
const unlocked = ref<Record<string, number>>(read())

export function unlockedAt(id: string): number | null {
  return unlocked.value[id] ?? null
}

export function unlock(id: string) {
  if (unlocked.value[id])
    return
  unlocked.value = { ...unlocked.value, [id]: Date.now() }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked.value))
  }
  catch {
    // Без хранилища карточка открыта до перезапуска
  }
}
