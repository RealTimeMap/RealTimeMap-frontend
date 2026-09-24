import type { Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { Filesystem } from '@capacitor/filesystem'

export interface FileCacheOptions {
  directory: Directory
  root: string
  maxBytes: number
  /** Приводит URL к каноничному виду перед хэшированием (например, убирает поддомены CDN) */
  normalize?: (url: string) => string
  checkEveryWrites?: number
}

/** Детерминированный hex-ключ (FNV-1a 32-bit) для имени файла. */
export function hashKey(value: string): string {
  let hash = 0x811C9DC5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// --- base64 <-> ArrayBuffer ---
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

/** Кэш бинарных ресурсов в Filesystem по URL. Работает только на нативе. */
export function createFileCache(options: FileCacheOptions) {
  const {
    directory,
    root,
    maxBytes,
    normalize = (url: string) => url,
    checkEveryWrites = 40,
  } = options

  let index: Set<string> | null = null
  let indexPromise: Promise<Set<string>> | null = null
  let writesSinceCheck = 0

  const keyFor = (url: string) => hashKey(normalize(url))
  const pathFor = (key: string) => `${root}/${key}`

  function ensureIndex(): Promise<Set<string>> {
    if (index)
      return Promise.resolve(index)
    if (!indexPromise) {
      indexPromise = Filesystem.readdir({ directory, path: root })
        .then(({ files }) => new Set(files.map(f => f.name)))
        .catch(() => new Set<string>())
        .then((set) => {
          index = set
          return set
        })
    }
    return indexPromise
  }

  async function has(url: string): Promise<boolean> {
    return (await ensureIndex()).has(keyFor(url))
  }

  /** URL, по которому WebView отдаёт файл напрямую; null — если файла нет в кэше. */
  async function fileSrc(url: string): Promise<string | null> {
    const key = keyFor(url)
    if (!(await ensureIndex()).has(key))
      return null
    try {
      const { uri } = await Filesystem.getUri({ directory, path: pathFor(key) })
      return Capacitor.convertFileSrc(uri)
    }
    catch {
      index?.delete(key)
      return null
    }
  }

  async function readBinary(path: string): Promise<ArrayBuffer> {
    try {
      const {
        uri,
      } = await Filesystem.getUri({ directory, path })
      const res = await fetch(Capacitor.convertFileSrc(uri))
      if (res.ok)
        return await res.arrayBuffer()
    }
    catch {
      // convertFileSrc/fetch недоступен — уходим на base64-фолбэк ниже.
    }
    const { data } = await Filesystem.readFile({ directory, path })
    return base64ToArrayBuffer(data as string)
  }

  async function read(url: string): Promise<ArrayBuffer | null> {
    const key = keyFor(url)
    const set = await ensureIndex()
    if (!set.has(key))
      return null

    try {
      return await readBinary(pathFor(key))
    }
    catch {
      set.delete(key)
      return null
    }
  }

  async function enforceLimit(): Promise<void> {
    try {
      const { files } = await Filesystem.readdir({ directory, path: root })
      let total = files.reduce((sum, f) => sum + (f.size ?? 0), 0)
      if (total <= maxBytes)
        return

      const target = maxBytes * 0.9
      const oldestFirst = [...files].sort((a, b) => (a.mtime ?? 0) - (b.mtime ?? 0))
      for (const file of oldestFirst) {
        if (total <= target)
          break
        try {
          await Filesystem.deleteFile({ directory, path: pathFor(file.name) })
          index?.delete(file.name)
          total -= file.size ?? 0
        }
        catch {
        }
      }
    }
    catch {
      // readdir недоступен — лимит не критичен, пропускаем
    }
  }

  async function write(url: string, buffer: ArrayBuffer): Promise<void> {
    const key = keyFor(url)
    await Filesystem.writeFile({
      directory,
      path: pathFor(key),
      data: arrayBufferToBase64(buffer),
      recursive: true,
    })
    const set = await ensureIndex()
    set.add(key)

    if (++writesSinceCheck >= checkEveryWrites) {
      writesSinceCheck = 0
      void enforceLimit()
    }
  }

  async function getSize(): Promise<number> {
    try {
      const { files } = await Filesystem.readdir({ directory, path: root })
      return files.reduce((total, file) => total + (file.size ?? 0), 0)
    }
    catch {
      return 0
    }
  }

  async function clear(): Promise<void> {
    try {
      await Filesystem.rmdir({ directory, path: root, recursive: true })
    }
    catch (error) {
      console.error(`[fileCache:${root}] Не удалось очистить кеш:`, error)
    }
    index = new Set()
    indexPromise = null
  }

  /** Сбрасывает индекс в памяти, если папку очистили снаружи. */
  function resetIndex(): void {
    index = null
    indexPromise = null
  }

  return { keyFor, has, fileSrc, read, write, getSize, clear, resetIndex }
}
