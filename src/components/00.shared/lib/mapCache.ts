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

function pathFor(url: string): string {
  return `${CACHE_ROOT}/${keyFor(url)}`
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

// --- операции с кешем ---
export async function read(url: string): Promise<ArrayBuffer | null> {
  try {
    const { data } = await Filesystem.readFile({ directory: CACHE_DIR, path: pathFor(url) })
    return base64ToArrayBuffer(data as string)
  }
  catch {
    return null
  }
}

export async function write(url: string, buffer: ArrayBuffer): Promise<void> {
  await Filesystem.writeFile({
    directory: CACHE_DIR,
    path: pathFor(url),
    data: arrayBufferToBase64(buffer),
    recursive: true,
  })
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
}
