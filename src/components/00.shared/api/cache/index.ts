import type { RequestConfig } from '../api.types'
import { getCookie } from '@/components/00.shared/lib/cookie'
import { createIdbStore } from '@/components/00.shared/lib/idbStore'

const responses = createIdbStore({
  store: 'responses',
  maxEntries: 500,
  maxAgeMs: 14 * 24 * 60 * 60 * 1000,
  pruneEvery: 50,
})

const EXCLUDED = [
  /^\/auth\//,
  /^\/sessions/,
  /^\/profile\/search/,
  /^\/personal\//,
  /^\/group\//,
]

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

export function readCache<T>(key: string): Promise<T | undefined> {
  return responses.read<T>(key)
}

export function writeCache(key: string, data: unknown): void {
  responses.write(key, data)
}

export function clearApiCache(): Promise<void> {
  return responses.clear()
}
