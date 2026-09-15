import type { MaybeRefOrGetter, Ref } from 'vue'
import type { EntityId } from './types'
import { onScopeDispose, ref, toValue, watch } from 'vue'

/** Грейс-период (мс): в течение него плашка «не синхронизировано» не показывается. */
export const SYNC_GRACE_MS = 1200

/**
 * Откладывает показ pending-состояния: возвращает `true` только если исходный
 * `pending` держится дольше грейс-периода. Быстрый онлайн-sync (обычная правка)
 * снимает pending раньше — и плашка не мигает.
 */
export function useDeferredPending(
  source: MaybeRefOrGetter<boolean | undefined>,
  graceMs = SYNC_GRACE_MS,
): Ref<boolean> {
  const deferred = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  watch(() => toValue(source), (pending) => {
    clear()
    if (pending)
      timer = setTimeout(() => { deferred.value = true }, graceMs)
    else
      deferred.value = false
  }, { immediate: true })

  onScopeDispose(clear)

  return deferred
}

/** Сущность с признаком pending и идентификатором. */
interface PendingItem {
  id: EntityId
  pending: boolean
}

/**
 * Версия для списков: возвращает `Set` id тех сущностей, чей pending держится
 * дольше грейс-периода. Каждый id получает собственный отложенный таймер, так что
 * быстро синхронизированные записи в набор не попадают и плашка не мигает.
 */
export function useDeferredPendingSet(
  source: MaybeRefOrGetter<PendingItem[]>,
  graceMs = SYNC_GRACE_MS,
): Ref<Set<EntityId>> {
  const deferred = ref<Set<EntityId>>(new Set())
  const timers = new Map<EntityId, ReturnType<typeof setTimeout>>()

  function clearTimer(id: EntityId) {
    const t = timers.get(id)
    if (t) {
      clearTimeout(t)
      timers.delete(id)
    }
  }

  watch(() => toValue(source), (items) => {
    const pendingIds = new Set(items.filter(i => i.pending).map(i => i.id))

    // Записи, вышедшие из pending, — сразу убираем из набора и гасим таймер.
    for (const id of [...deferred.value]) {
      if (!pendingIds.has(id)) {
        deferred.value.delete(id)
        clearTimer(id)
      }
    }
    for (const id of [...timers.keys()]) {
      if (!pendingIds.has(id))
        clearTimer(id)
    }

    // Новые pending без активного таймера/показа — ставим отложенный показ.
    for (const id of pendingIds) {
      if (deferred.value.has(id) || timers.has(id))
        continue
      timers.set(id, setTimeout(() => {
        deferred.value = new Set(deferred.value).add(id)
        timers.delete(id)
      }, graceMs))
    }
  }, { immediate: true, deep: true })

  onScopeDispose(() => {
    for (const t of timers.values())
      clearTimeout(t)
    timers.clear()
  })

  return deferred
}
