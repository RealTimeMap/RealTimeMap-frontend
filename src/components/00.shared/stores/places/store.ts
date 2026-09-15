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
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import { applyRemoved, mergeGroups, mergeUpserted, syncGroupToLocal, syncMarkToLocal } from './mappers'
import { PermanentMutationError, playMutation } from './mutationQueue'
import { LOCAL_PHOTO_PREFIX, savePendingPhoto } from './photoStore'
import { placesStorage } from './storage'

const SYNC_PAGE_LIMIT = 200

function uuid(): string {
  return crypto.randomUUID()
}

export const usePlacesStore = defineStore('places', () => {
  const marks = ref<LocalPersonalMark[]>([])
  const groups = ref<LocalGroup[]>([])
  const queue = ref<Mutation[]>([])
  const cursor = ref<number | undefined>(undefined)

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
    if (typeof groupId !== 'number')
      return []
    return marks.value.filter((m) => {
      const ids: number[] = m.groupsIds ?? m.groupsIds ?? []
      return ids.includes(groupId)
    })
  }
  /** Метки без групп (раздел «Без группы»). */
  const marksWithoutGroup = computed(() =>
    marks.value.filter((m) => {
      const ids: number[] = m.groupsIds ?? m.groupsIds ?? []
      return ids.length === 0
    }),
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
      groupsIds: item.groupsIds ?? item.groupsIds ?? [],
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
    const photos: PendingPhoto[] = []
    for (const file of photoFiles)
      photos.push(await savePendingPhoto(file))

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

    const photos: PendingPhoto[] = []
    for (const file of photoFiles)
      photos.push(await savePendingPhoto(file))

    // Оптимистично убираем помеченные на удаление фото...
    if (patch.photosToDelete?.length) {
      const toDelete = new Set(patch.photosToDelete)
      mark.photos = mark.photos.filter(p => !toDelete.has(p))
    }
    // ...и дописываем новые (local://-путь резолвится из Filesystem), чтобы
    // изменения были видны сразу — до подтверждения синком.
    if (photos.length)
      mark.photos = [...mark.photos, ...photos.map(p => `${LOCAL_PHOTO_PREFIX}${p.path}`)]

    await persistMarks()
    // Локальные (ещё не созданные) метки правим прямо в pending create-мутации.
    if (typeof id === 'string')
      await mergeIntoPendingCreate(id, patch, photos)
    else
      await enqueue({ id: uuid(), kind: 'mark.update', target: id, payload: patch, photos })
    void trySync()
  }

  async function deleteMark(id: EntityId) {
    marks.value = marks.value.filter(m => m.id !== id)
    await persistMarks()
    if (typeof id === 'string') {
      // Локальная метка ещё не на сервере — удаляем её create-мутацию из очереди.
      queue.value = queue.value.filter(mut => !('localId' in mut && mut.localId === id))
      await persistQueue()
    }
    else {
      await enqueue({ id: uuid(), kind: 'mark.delete', target: id })
    }
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
    if (typeof id === 'number')
      await enqueue({ id: uuid(), kind: 'group.update', target: id, payload })
    void trySync()
  }

  async function deleteGroup(id: EntityId) {
    groups.value = groups.value.filter(g => g.id !== id)
    await persistGroups()
    if (typeof id === 'string') {
      queue.value = queue.value.filter(mut => !('localId' in mut && mut.localId === id))
      await persistQueue()
    }
    else {
      await enqueue({ id: uuid(), kind: 'group.delete', target: id })
    }
    void trySync()
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
  function remapId(localId: string, serverId: number, revision: number) {
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
    }
    // Ссылки на локальную группу в остальных мутациях/метках ремапить не нужно:
    // groupsIds хранят number, локальные группы туда не попадают до подтверждения.
  }

  /** Проигрывание всей очереди мутаций (push). */
  async function pushQueue() {
    while (queue.value.length > 0) {
      const mutation = queue.value[0]
      try {
        const result = await playMutation(mutation)
        if (result)
          remapId(result.localId, result.serverId, result.revision)
        else
          clearPending(mutation)
      }
      catch (error) {
        if (error instanceof PermanentMutationError) {
          // Невосстановимая ошибка — выбрасываем мутацию, чтобы не блокировать очередь.
          clearPending(mutation)
        }
        else {
          // Сетевая/временная ошибка — прекращаем, повторим в следующий sync.
          throw error
        }
      }
      queue.value.shift()
      await persistQueue()
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
      const res = await personalMarkApi.syncPersonalData({ since: cursor.value, limit: SYNC_PAGE_LIMIT })

      const incomingMarks = res.sections.personalMarks.upserted.map(m => syncMarkToLocal(m, userId))
      marks.value = mergeUpserted(marks.value, incomingMarks)
      marks.value = applyRemoved(marks.value, res.sections.personalMarks.removed)

      const incomingGroups = res.sections.groups.upserted.map(g => syncGroupToLocal(g, userId))
      groups.value = mergeGroups(groups.value, incomingGroups)
      groups.value = applyRemoved(groups.value, res.sections.groups.removed)

      cursor.value = res.updateTo
      await placesStorage.saveCursor(res.updateTo)
      hasMore = res.hasMore
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
    createMark,
    updateMark,
    deleteMark,
    createGroup,
    updateGroup,
    deleteGroup,
  }
})
