import type { PendingPhoto } from './types'
import { Directory, Filesystem } from '@capacitor/filesystem'

const DIR = Directory.Data
const ROOT = 'personal-photos'

/** Префикс, помечающий локальное (ещё не загруженное) фото в mark.photos. */
export const LOCAL_PHOTO_PREFIX = 'local://'

export function isLocalPhoto(photo: string): boolean {
  return photo.startsWith(LOCAL_PHOTO_PREFIX)
}

export function localPhotoPath(photo: string): string {
  return photo.slice(LOCAL_PHOTO_PREFIX.length)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

function extFor(mimeType: string): string {
  if (mimeType.includes('png'))
    return 'png'
  if (mimeType.includes('webp'))
    return 'webp'
  return 'jpg'
}

/** Сохраняет снятое офлайн фото в Filesystem, возвращает дескриптор для очереди. */
export async function savePendingPhoto(file: Blob): Promise<PendingPhoto> {
  const mimeType = file.type || 'image/jpeg'
  const path = `${ROOT}/${crypto.randomUUID()}.${extFor(mimeType)}`
  const buffer = await file.arrayBuffer()
  await Filesystem.writeFile({
    directory: DIR,
    path,
    data: arrayBufferToBase64(buffer),
    recursive: true,
  })
  return { path, mimeType }
}

/** Читает офлайн-фото обратно в Blob для отправки в FormData. */
export async function readPendingPhoto(photo: PendingPhoto): Promise<Blob> {
  const { data } = await Filesystem.readFile({ directory: DIR, path: photo.path })
  return base64ToBlob(data as string, photo.mimeType)
}

/** Удаляет офлайн-фото после успешной отправки. */
export async function removePendingPhoto(photo: PendingPhoto): Promise<void> {
  try {
    await Filesystem.deleteFile({ directory: DIR, path: photo.path })
  }
  catch { }
}

function extToMime(path: string): string {
  if (path.endsWith('.png'))
    return 'image/png'
  if (path.endsWith('.webp'))
    return 'image/webp'
  return 'image/jpeg'
}

/**
 * Отображаемый data-URL для офлайн-фото (по пути в Filesystem).
 * Кроссплатформенно: и в вебе, и в нативе `<img :src>` рендерит data:.
 */
export async function photoDisplayUrl(path: string): Promise<string> {
  const { data } = await Filesystem.readFile({ directory: DIR, path })
  return `data:${extToMime(path)};base64,${data as string}`
}
