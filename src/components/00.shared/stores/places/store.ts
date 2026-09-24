import type {
  CreateGroupPayload,
  CreatePersonalMarkPayload,
  EntityId,
  LocalGroup,
  LocalPersonalMark,
  Mutation,
  PendingPhoto,
  UpdateGroupPayload,
  UpdatePersonalMarkPayload,
} from './types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { personalMarkApi } from '@/components/00.shared/services/personal-mark'
import { useAuthStore } from '@/components/02.features/auth/Authentication/model/auth'
import { applyRemoved, mergeGroups, mergeUpserted, syncGroupToLocal, syncMarkToLocal } from './mappers'
import { PermanentMutationError, playMutation } from './mutationQueue'
import { LOCAL_PHOTO_PREFIX, removePendingPhoto, savePendingPhoto } from './photoStore'
import { placesStorage } from './storage'

const SYNC_PAGE_LIMIT = 200

function uuid(): string {
  return crypto.randomUUID()
}
function createLock() {
  let tail: Promise<unknown> = Promise.resolve()
  return function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = tail.then(fn, fn)
    tail = run.then(() => { }, () => { })
    return run
  }
}

async function savePendingPhotos(files: Blob[]): Promise<PendingPhoto[]> {
  const saved: PendingPhoto[] = []
  try {
    for (const file of files)
      saved.push(await savePendingPhoto(file))
    return saved
  }
  catch (error) {
    await Promise.all(saved.map(removePendingPhoto))
    throw error
  }
}

export const usePlacesStore = defineStore('places', () => {
  const marks = ref<LocalPersonalMark[]>([])
  const groups = ref<LocalGroup[]>([])
  const queue = ref<Mutation[]>([])
  const cursor = ref<number | undefined>(undefined)

  const withLock = createLock()

  const isSyncing = ref(false)
  const isHydrated = ref(false)
  /** Время последней успешной синхронизации (мс) — для индикации в UI. */
  const lastSyncAt = ref<number | null>(null)
  /** Последняя ошибка синхронизации (для показа «не удалось обновить»). */
  const lastSyncError = ref(false)

  const pendingCount = computed(() => queue.value.length)
  const visibleMarks = computed(() => marks.value.filter(m => m.isVisible))

  /** Метки конкретной группы (сортировка/фильтрация — на фронте). */
  function marksInGroup(groupId: EntityId): LocalPersonalMark[] {
    const gid = String(groupId)
    return marks.value.filter(m => m.groupsIds.includes(gid))
  }
  /** Метки без групп (раздел «Без группы»). */
  const marksWithoutGroup = computed(() =>
    marks.value.filter(m => (m.groupsIds ?? []).length === 0),
  )

  function currentUserId(): number {
    return useAuthStore().user?.userId ?? 0
  }

  async function persistMarks() {
    await placesStorage.saveMarks(marks.value)
  }
  async function persistGroups() {
    await placesStorage.saveGroups(groups.value)
  }
  async function persistQueue() {
    await placesStorage.saveQueue(queue.value)
  }

  /** Загрузка локального состояния из Preferences (один раз при старте). */
  async function hydrate() {
    if (isHydrated.value)
      return
    // Одноразовая миграция: сбрасывает cursor при устаревшей версии кэша,
    // чтобы ближайший sync полностью перечитал данные с сервера.
    await placesStorage.migrate()
    const [m, g, q, c] = await Promise.all([
      placesStorage.loadMarks(),
      placesStorage.loadGroups(),
      placesStorage.loadQueue(),
      placesStorage.loadCursor(),
    ])
    marks.value = m.map(item => ({
      ...item,
      groupsIds: item.groupsIds ?? [],
      photos: (item.photos ?? []).filter((p): p is string => typeof p === 'string' && p.length > 0),
    }))
    groups.value = g
    queue.value = q
    cursor.value = c
    isHydrated.value = true
  }

  function enqueue(mutation: Mutation) {
    queue.value.push(mutation)
    return persistQueue()
  }

  // ── Оптимистичные экшены: пишут в стор + Preferences + очередь ──────────

  async function createMark(
    input: Omit<CreatePersonalMarkPayload, 'photos'>,
    photoFiles: Blob[] = [],
  ): Promise<LocalPersonalMark> {
    const localId = uuid()
    const photos = await savePendingPhotos(photoFiles)

    const mark: LocalPersonalMark = {
      id: localId,
      localId,
      userId: currentUserId(),
      revision: 0,
      coordinates: [input.longitude, input.latitude],
      title: input.title,
      description: input.description,
      category: input.category,
      color: input.color,
      icon: input.icon,
      isShare: false,
      isVisible: input.isVisible ?? true,
      groupsIds: input.groupsIds ?? [],
      // Локальные фото хранятся с префиксом local:// — резолвятся из Filesystem.
      photos: photos.map(p => `${LOCAL_PHOTO_PREFIX}${p.path}`),
      pending: true,
    }
    marks.value.push(mark)
    await persistMarks()
    await enqueue({ id: uuid(), kind: 'mark.create', localId, payload: input, photos })
    void trySync()
    return mark
  }

  async function updateMark(id: EntityId, patch: UpdatePersonalMarkPayload, photoFiles: Blob[] = []) {
    const mark = marks.value.find(m => m.id === id)
    if (!mark)
      return
    Object.assign(mark, {
      title: patch.title ?? mark.title,
      description: patch.description ?? mark.description,
      category: patch.category ?? mark.category,
      color: patch.color ?? mark.color,
      icon: patch.icon ?? mark.icon,
      isVisible: patch.isVisible ?? mark.isVisible,
      groupsIds: patch.groupsIds ?? mark.groupsIds,
      pending: true,
    })
    if (patch.longitude != null && patch.latitude != null)
      mark.coordinates = [patch.longitude, patch.latitude]

    const photos = await savePendingPhotos(photoFiles)

    // Оптимистично убираем помеченные на удаление фото...
    if (patch.photosToDelete?.length) {
      const toDelete = new Set(patch.photosToDelete)
      mark.photos = mark.photos.filter(p => !toDelete.has(p))
    }
    if (photos.length)
      mark.photos = [...mark.photos, ...photos.map(p => `${LOCAL_PHOTO_PREFIX}${p.path}`)]

    await persistMarks()
    await withLock(async () => {
      if (mark.localId)
        await mergeIntoPendingCreate(mark.localId, patch, photos)
      else
        await enqueue({ id: uuid(), kind: 'mark.update', target: mark.id, payload: patch, photos })
    })
    void trySync()
  }

  async function deleteMark(id: EntityId) {
    const mark = marks.value.find(m => m.id === id)
    marks.value = marks.value.filter(m => m.id !== id)
    await persistMarks()
    await withLock(async () => {
      const localId = mark?.localId
      if (localId) {
        queue.value = queue.value.filter(mut => !('localId' in mut && mut.localId === localId))
        await persistQueue()
      }
      else {
        const target = mark?.id ?? id
        await enqueue({ id: uuid(), kind: 'mark.delete', target })
      }
    })
    void trySync()
  }

  async function createGroup(payload: CreateGroupPayload): Promise<LocalGroup> {
    const localId = uuid()
    const group: LocalGroup = {
      id: localId,
      localId,
      userId: currentUserId(),
      revision: 0,
      name: payload.name,
      description: payload.description,
      color: payload.color,
      icon: payload.icon,
      pending: true,
    }
    groups.value.push(group)
    await persistGroups()
    await enqueue({ id: uuid(), kind: 'group.create', localId, payload })
    void trySync()
    return group
  }

  async function updateGroup(id: EntityId, payload: UpdateGroupPayload) {
    const group = groups.value.find(g => g.id === id)
    if (!group)
      return
    Object.assign(group, {
      name: payload.name ?? group.name,
      description: payload.description ?? group.description,
      color: payload.color ?? group.color,
      icon: payload.icon ?? group.icon,
      pending: true,
    })
    await persistGroups()
    await withLock(async () => {
      if (group.localId)
        await mergeGroupIntoPendingCreate(group.localId, payload)
      else
        await enqueue({ id: uuid(), kind: 'group.update', target: group.id, payload })
    })
    void trySync()
  }

  async function deleteGroup(id: EntityId) {
    const group = groups.value.find(g => g.id === id)
    groups.value = groups.value.filter(g => g.id !== id)
    await persistGroups()
    await withLock(async () => {
      const localId = group?.localId
      if (localId) {
        // Локальная группа ещё не на сервере — удаляем её create-мутацию из очереди.
        queue.value = queue.value.filter(mut => !('localId' in mut && mut.localId === localId))
        await persistQueue()
      }
      else {
        const target = group?.id ?? id
        await enqueue({ id: uuid(), kind: 'group.delete', target })
      }
    })
    void trySync()
  }

  /** Обновление ещё не отправленной группы — правим прямо в её create-мутации. */
  async function mergeGroupIntoPendingCreate(localId: string, payload: UpdateGroupPayload) {
    const mut = queue.value.find(m => m.kind === 'group.create' && m.localId === localId)
    if (mut && mut.kind === 'group.create') {
      Object.assign(mut.payload, payload)
      await persistQueue()
    }
  }

  /** Обновление ещё не отправленной метки — правим прямо в её create-мутации. */
  async function mergeIntoPendingCreate(localId: string, patch: UpdatePersonalMarkPayload, photos: PendingPhoto[]) {
    const mut = queue.value.find(m => m.kind === 'mark.create' && m.localId === localId)
    if (mut && mut.kind === 'mark.create') {
      Object.assign(mut.payload, patch)
      mut.photos.push(...photos)
      await persistQueue()
    }
  }

  // ── Синхронизация ───────────────────────────────────────────────────────

  /** Ремап временного localId на серверный id во всех связанных данных. */
  function remapId(localId: string, serverId: EntityId, revision: number) {
    const mark = marks.value.find(m => m.localId === localId)
    if (mark) {
      mark.id = serverId
      mark.revision = revision
      mark.pending = false
      mark.localId = undefined
    }
    const group = groups.value.find(g => g.localId === localId)
    if (group) {
      group.id = serverId
      group.revision = revision
      group.pending = false
      group.localId = undefined
      // Группа подтверждена: заменяем её временный uuid на серверный во всех
      // ссылках groupsIds — и в метках, и в ещё не отправленных мутациях.
      remapGroupRef(localId, String(serverId))
    }
  }

  /** Замена временного uuid группы на серверный в groupsIds меток и очереди. */
  function remapGroupRef(localId: string, serverId: string) {
    for (const mark of marks.value) {
      const i = mark.groupsIds.indexOf(localId)
      if (i !== -1)
        mark.groupsIds.splice(i, 1, serverId)
    }
    for (const mut of queue.value) {
      if (mut.kind !== 'mark.create' && mut.kind !== 'mark.update')
        continue
      const ids = mut.payload.groupsIds
      if (!ids)
        continue
      const i = ids.indexOf(localId)
      if (i !== -1)
        ids.splice(i, 1, serverId)
    }
  }

  /** Проигрывание всей очереди мутаций (push). */
  async function pushQueue() {
    let entitiesTouched = false
    while (queue.value.length > 0) {
      await withLock(async () => {
        const mutation = queue.value[0]
        try {
          const result = await playMutation(mutation)
          if (result) {
            remapId(result.localId, result.serverId, result.revision)
            await persistMarks()
            await persistGroups()
          }
          else {
            clearPending(mutation)
            entitiesTouched = true
          }
        }
        catch (error) {
          if (error instanceof PermanentMutationError) {
            // Невосстановимая ошибка — выбрасываем мутацию, чтобы не блокировать очередь.
            clearPending(mutation)
            entitiesTouched = true
          }
          else {
            // Сетевая/временная ошибка — прекращаем, повторим в следующий sync.
            throw error
          }
        }
        queue.value.shift()
        await persistQueue()
      })
    }
    if (entitiesTouched) {
      await persistMarks()
      await persistGroups()
    }
  }

  /** Снимает флаг pending с сущности, затронутой не-create мутацией. */
  function clearPending(mutation: Mutation) {
    if ('target' in mutation) {
      const mark = marks.value.find(m => m.id === mutation.target)
      if (mark)
        mark.pending = false
      const group = groups.value.find(g => g.id === mutation.target)
      if (group)
        group.pending = false
    }
  }

  /** Дельта-загрузка серверных изменений (pull). */
  async function pullChanges() {
    const userId = currentUserId()
    let hasMore = true
    while (hasMore) {
      const since = cursor.value
      const res = await personalMarkApi.syncPersonalData({ since, limit: SYNC_PAGE_LIMIT })

      const incomingMarks = res.sections.personalMarks.upserted.map(m => syncMarkToLocal(m, userId))
      marks.value = mergeUpserted(marks.value, incomingMarks)
      marks.value = applyRemoved(marks.value, res.sections.personalMarks.removed)

      const incomingGroups = res.sections.groups.upserted.map(g => syncGroupToLocal(g, userId))
      groups.value = mergeGroups(groups.value, incomingGroups)
      groups.value = applyRemoved(groups.value, res.sections.groups.removed)

      cursor.value = res.updateTo
      await placesStorage.saveCursor(res.updateTo)
      hasMore = res.hasMore

      if (hasMore && since != null && res.updateTo === since) {
        console.warn('[places sync] курсор не продвинулся, прерываю pull во избежание бесконечного цикла')
        break
      }
    }
    await persistMarks()
    await persistGroups()
  }

  /**
   * Полный цикл синхронизации: сначала push локальных мутаций, затем pull
   * серверных изменений. Идемпотентен, не запускается повторно во время работы.
   */
  async function sync(): Promise<void> {
    if (isSyncing.value)
      return
    isSyncing.value = true
    try {
      await hydrate()
      await pushQueue()
      await pullChanges()
      lastSyncAt.value = Date.now()
      lastSyncError.value = false
    }
    finally {
      isSyncing.value = false
    }
  }

  /** Безопасный запуск sync: глушит сетевые ошибки (повтор при след. онлайне). */
  async function trySync(): Promise<void> {
    try {
      await sync()
    }
    catch {
      // офлайн или временная ошибка — очередь останется, повторим позже
      lastSyncError.value = true
    }
  }

  async function reset(): Promise<void> {
    marks.value = []
    groups.value = []
    queue.value = []
    cursor.value = undefined
    lastSyncAt.value = null
    lastSyncError.value = false
    isSyncing.value = false
    isHydrated.value = false
    await placesStorage.clear()
  }

  return {
    marks,
    groups,
    isSyncing,
    lastSyncAt,
    lastSyncError,
    pendingCount,
    visibleMarks,
    marksWithoutGroup,
    marksInGroup,
    hydrate,
    sync,
    trySync,
    reset,
    createMark,
    updateMark,
    deleteMark,
    createGroup,
    updateGroup,
    deleteGroup,
  }
})
