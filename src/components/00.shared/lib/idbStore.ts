const DB_NAME = 'rtm-api-cache'
const DB_VERSION = 2
/** Все хранилища базы: при добавлении нового поднимаем DB_VERSION. */
const STORES = ['responses', 'marks'] as const

export type IdbStoreName = typeof STORES[number]

interface Entry {
  key: string
  data: unknown
  savedAt: number
}

export interface IdbStoreOptions {
  store: IdbStoreName
  maxEntries: number
  maxAgeMs: number
  /** Раз во сколько записей чистить хранилище от лишнего и просроченного. */
  pruneEvery?: number
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise)
    return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!req.result.objectStoreNames.contains(name))
          req.result.createObjectStore(name, { keyPath: 'key' }).createIndex('savedAt', 'savedAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
    req.onblocked = () => resolve(null)
  })
  return dbPromise
}

/** Хранилище «ключ → данные» в IndexedDB с ограничением по числу записей и возрасту (LRU по времени записи). */
export function createIdbStore({ store, maxEntries, maxAgeMs, pruneEvery = 20 }: IdbStoreOptions) {
  let writesSincePrune = 0

  function tx<T>(mode: IDBTransactionMode, run: (objectStore: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
    return openDb().then(db => new Promise((resolve) => {
      if (!db) {
        resolve(undefined)
        return
      }
      try {
        const transaction = db.transaction(store, mode)
        const req = run(transaction.objectStore(store))
        transaction.oncomplete = () => resolve(req ? req.result : undefined)
        transaction.onerror = () => resolve(undefined)
        transaction.onabort = () => resolve(undefined)
      }
      catch {
        resolve(undefined)
      }
    }))
  }

  async function prune(): Promise<void> {
    const count = await tx<number>('readonly', objectStore => objectStore.count())
    const excess = (count ?? 0) - maxEntries
    const expiredBefore = Date.now() - maxAgeMs
    await tx('readwrite', (objectStore) => {
      let removed = 0
      const cursorReq = objectStore.index('savedAt').openCursor()
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result
        if (!cursor)
          return
        const entry = cursor.value as Entry
        if (removed < excess || entry.savedAt < expiredBefore) {
          cursor.delete()
          removed++
          cursor.continue()
        }
      }
    })
  }

  async function read<T>(key: string): Promise<T | undefined> {
    const entry = await tx<Entry | undefined>('readonly', objectStore => objectStore.get(key))
    if (!entry || Date.now() - entry.savedAt > maxAgeMs)
      return undefined
    return entry.data as T
  }

  function write(key: string, data: unknown): void {
    void tx('readwrite', objectStore => objectStore.put({ key, data, savedAt: Date.now() } satisfies Entry))
      .then(() => {
        if (++writesSincePrune >= pruneEvery) {
          writesSincePrune = 0
          void prune()
        }
      })
  }

  async function clear(): Promise<void> {
    await tx('readwrite', objectStore => objectStore.clear())
  }

  return { read, write, clear }
}
