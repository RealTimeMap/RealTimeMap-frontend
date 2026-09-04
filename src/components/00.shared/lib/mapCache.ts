import { Directory, Filesystem } from '@capacitor/filesystem'

const CACHE_DIR = Directory.Data
const CACHE_ROOT = 'map-cache'

export function normalizeUrl(url: string): string {
  return url.replace(/tiles-[a-d]\./g, 'tiles.')
}

/** Детерминированный hex-ключ (FNV-1a 32-bit) для имени файла. */
export function keyFor(url: string): string {
  const normalized = normalizeUrl(url)
  let hash = 0x811C9DC5
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i)
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

let cacheIndex: Set<string> | null = null
let indexPromise: Promise<Set<string>> | null = null

async function ensureIndex(): Promise<Set<string>> {
  if (cacheIndex)
    return cacheIndex
  if (!indexPromise) {
    indexPromise = Filesystem.readdir({ directory: CACHE_DIR, path: CACHE_ROOT })
      .then(({ files }) => new Set(files.map(f => f.name)))
      .catch(() => new Set<string>())
      .then((set) => {
        cacheIndex = set
        return set
      })
  }
  return indexPromise
}

export async function read(url: string): Promise<ArrayBuffer | null> {
  const key = keyFor(url)
  const index = await ensureIndex()
  if (!index.has(key))
    return null

  try {
    const { data } = await Filesystem.readFile({ directory: CACHE_DIR, path: `${CACHE_ROOT}/${key}` })
    return base64ToArrayBuffer(data as string)
  }
  catch {
    index.delete(key)
    return null
  }
}

export async function write(url: string, buffer: ArrayBuffer): Promise<void> {
  const key = keyFor(url)
  await Filesystem.writeFile({
    directory: CACHE_DIR,
    path: `${CACHE_ROOT}/${key}`,
    data: arrayBufferToBase64(buffer),
    recursive: true,
  })
  const index = await ensureIndex()
  index.add(key)
}

export async function getSize(): Promise<number> {
  try {
    const { files } = await Filesystem.readdir({ directory: CACHE_DIR, path: CACHE_ROOT })
    return files.reduce((total, file) => total + (file.size ?? 0), 0)
  }
  catch {
    return 0
  }
}

export async function clear(): Promise<void> {
  try {
    await Filesystem.rmdir({ directory: CACHE_DIR, path: CACHE_ROOT, recursive: true })
  }
  catch (error) {
    console.error('[mapCache] Не удалось очистить кеш карты:', error)
  }
  cacheIndex = new Set()
  indexPromise = null
}
