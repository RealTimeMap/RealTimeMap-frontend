import { Directory } from '@capacitor/filesystem'
import { createFileCache } from './fileCache'

export function normalizeUrl(url: string): string {
  return url.replace(/tiles-[a-d]\./g, 'tiles.')
}

const cache = createFileCache({
  directory: Directory.Data,
  root: 'map-cache',
  maxBytes: 80 * 1024 * 1024,
  normalize: normalizeUrl,
})

export const keyFor = cache.keyFor
export const read = cache.read
export const write = cache.write
export const getSize = cache.getSize
export const clear = cache.clear
