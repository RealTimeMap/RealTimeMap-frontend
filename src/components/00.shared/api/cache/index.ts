import type { RequestConfig } from '../api.types'
import { getCookie } from '@/components/00.shared/lib/cookie'

const DB_NAME = 'rtm-api-cache'
const STORE = 'responses'
const MAX_ENTRIES = 500
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
const PRUNE_EVERY = 50

const EXCLUDED = [
  /^\/auth\//,
  /^\/sessions/,
  /^\/profile\/search/,
  /^\/personal\//,
  /^\/group\//,
]

interface CacheEntry {
  key: string
  data: unknown
  savedAt: number
}

let dbPromise: Promise<IDBDatabase | null> | null = null
let writesSincePrune = 0

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise)
    return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'key' })
      store.createIndex('savedAt', 'savedAt')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
    req.onblocked = () => resolve(null)
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openDb().then(db => new Promise((resolve) => {
    if (!db) {
      resolve(undefined)
      return
    }
    try {
      const transaction = db.transaction(STORE, mode)
      const req = run(transaction.objectStore(STORE))
      transaction.oncomplete = () => resolve(req ? req.result : undefined)
      transaction.onerror = () => resolve(undefined)
      transaction.onabort = () => resolve(undefined)
    }
    catch {
      resolve(undefined)
    }
  }))
}

function sessionScope(): string {
  const token = getCookie('token') ?? ''
  let hash = 0x811C9DC5
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function serializeParams(params: unknown): string {
  if (!params)
    return ''
  if (params instanceof URLSearchParams) {
    const sorted = new URLSearchParams([...params.entries()].sort(([a], [b]) => a.localeCompare(b)))
    return sorted.toString()
  }
  if (typeof params === 'object') {
    const entries = Object.entries(params as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
    return JSON.stringify(entries)
  }
  return String(params)
}

export function isCacheable(url: string, config: RequestConfig): boolean {
  return config.offlineCache !== false && !EXCLUDED.some(re => re.test(url))
}

export function cacheKey(url: string, config: RequestConfig): string {
  return `${sessionScope()}|${url}|${serializeParams(config.params)}`
}

export async function readCache<T>(key: string): Promise<T | undefined> {
  const entry = await tx<CacheEntry | undefined>('readonly', store => store.get(key))
  if (!entry || Date.now() - entry.savedAt > MAX_AGE_MS)
    return undefined
  return entry.data as T
}

export function writeCache(key: string, data: unknown): void {
  void tx('readwrite', store => store.put({ key, data, savedAt: Date.now() } satisfies CacheEntry))
    .then(() => {
      if (++writesSincePrune >= PRUNE_EVERY) {
        writesSincePrune = 0
        void pruneCache()
      }
    })
}

async function pruneCache(): Promise<void> {
  const count = await tx<number>('readonly', store => store.count())
  const excess = (count ?? 0) - MAX_ENTRIES
  const expiredBefore = Date.now() - MAX_AGE_MS
  await tx('readwrite', (store) => {
    let removed = 0
    const cursorReq = store.index('savedAt').openCursor()
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (!cursor)
        return
      const entry = cursor.value as CacheEntry
      if (removed < excess || entry.savedAt < expiredBefore) {
        cursor.delete()
        removed++
        cursor.continue()
      }
    }
  })
}

export async function clearApiCache(): Promise<void> {
  await tx('readwrite', store => store.clear())
}
