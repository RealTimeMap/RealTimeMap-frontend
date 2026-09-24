import type { MaybeRefOrGetter } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Directory } from '@capacitor/filesystem'
import { createFileCache } from './fileCache'

const cache = createFileCache({
  directory: Directory.Cache,
  root: 'image-cache',
  maxBytes: 150 * 1024 * 1024,
})

const pending = new Map<string, Promise<string>>()

function isRemote(src: string): boolean {
  return /^https?:\/\//.test(src)
}

/** Отдаёт картинку из Filesystem-кэша, а при промахе один раз скачивает и сохраняет её. */
export function resolveCachedImage(src: string): Promise<string> {
  const existing = pending.get(src)
  if (existing)
    return existing

  const task = (async () => {
    const cached = await cache.fileSrc(src)
    if (cached)
      return cached
    try {
      const res = await fetch(src)
      if (!res.ok)
        return src
      await cache.write(src, await res.arrayBuffer())
      return (await cache.fileSrc(src)) ?? src
    }
    catch {
      return src
    }
  })()

  pending.set(src, task)
  void task.finally(() => pending.delete(src))
  return task
}

/**
 * Источник картинки с офлайн-кэшем. На нативе подменяет удалённый URL локальным файлом;
 * в вебе возвращает исходный URL — там картинки кэширует service worker.
 */
export function useCachedImage(src: MaybeRefOrGetter<string | undefined | null>) {
  const resolved = ref<string | undefined>()
  const native = Capacitor.isNativePlatform()

  watch(() => toValue(src), (value, _, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })

    if (!value || !native || !isRemote(value)) {
      resolved.value = value ?? undefined
      return
    }

    resolved.value = undefined
    void resolveCachedImage(value).then((url) => {
      if (!cancelled)
        resolved.value = url
    })
  }, { immediate: true })

  return resolved
}

/** То же, что useCachedImage, для списка картинок (например, галереи). */
export function useCachedImages(srcs: MaybeRefOrGetter<string[] | undefined | null>) {
  const resolved = ref<string[]>([])
  const native = Capacitor.isNativePlatform()

  watch(() => toValue(srcs), (list, _, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })

    const items = list ?? []
    if (!native) {
      resolved.value = items
      return
    }

    resolved.value = items.map(() => '')
    items.forEach((src, i) => {
      const done = (url: string) => {
        if (!cancelled)
          resolved.value[i] = url
      }
      if (isRemote(src))
        void resolveCachedImage(src).then(done)
      else
        done(src)
    })
  }, { immediate: true })

  return resolved
}

export function resetImageCacheIndex(): void {
  cache.resetIndex()
}
