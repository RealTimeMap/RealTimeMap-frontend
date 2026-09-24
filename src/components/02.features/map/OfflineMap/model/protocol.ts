import type { RequestParameters } from 'maplibre-gl'
import { Capacitor } from '@capacitor/core'
import * as maplibregl from 'maplibre-gl'
import { read, write } from '@/components/00.shared/lib/mapCache'

const PROTOCOL = 'rtm'
const MAP_HOST = 'cartocdn.com'

let registered = false

/**
 * Регистрирует кастомный протокол MapLibre для офлайн-кеша карты.
 * Хендлер читает ресурс из Filesystem, а при отсутствии — качает из сети и сохраняет.
 * Работает только на нативе; на вебе офлайн обеспечивает service worker (workbox).
 */
export function registerOfflineMapProtocol(): void {
  if (registered || !Capacitor.isNativePlatform())
    return

  registered = true

  maplibregl.addProtocol(PROTOCOL, async (params: RequestParameters) => {
    const original = decodeURIComponent(params.url.replace(`${PROTOCOL}://`, ''))

    let buffer = await read(original)
    if (!buffer) {
      const response = await fetch(original)
      buffer = await response.arrayBuffer()
      // Сохраняем в фоне, не задерживая отрисовку.
      write(original, buffer).catch(() => {})
    }

    // MapLibre ждёт разный тип ответа в зависимости от ресурса:
    // style.json / TileJSON / sprite.json → объект, спрайт-картинка → image, тайлы → байты.
    switch (params.type) {
      case 'json':
        return { data: JSON.parse(new TextDecoder().decode(buffer)) }
      case 'string':
        return { data: new TextDecoder().decode(buffer) }
      case 'image':
        return { data: await createImageBitmap(new Blob([buffer])) }
      default:
        return { data: buffer }
    }
  })
}

export function buildTransformRequest(): ((url: string) => { url: string }) | undefined {
  if (!Capacitor.isNativePlatform())
    return undefined

  return (url: string) => {
    if (url.includes(MAP_HOST))
      return { url: `${PROTOCOL}://${encodeURIComponent(url)}` }
    return { url }
  }
}
