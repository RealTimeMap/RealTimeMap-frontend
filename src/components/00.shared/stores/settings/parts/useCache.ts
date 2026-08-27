import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { formatBytes } from '@/components/00.shared/lib/formatBytes'

const CACHE_DIR = Directory.Cache

async function calcNativeDirSize(path: string): Promise<number> {
  let total = 0
  const { files } = await Filesystem.readdir({ directory: CACHE_DIR, path })

  for (const file of files) {
    const childPath = path ? `${path}/${file.name}` : file.name
    if (file.type === 'directory')
      total += await calcNativeDirSize(childPath)
    else
      total += file.size ?? 0
  }

  return total
}

async function calcWebCacheSize(): Promise<number> {
  if (!('caches' in window))
    return 0

  let total = 0
  const names = await caches.keys()

  for (const name of names) {
    const cache = await caches.open(name)
    const requests = await cache.keys()

    for (const request of requests) {
      const response = await cache.match(request)
      if (!response)
        continue

      const blob = await response.clone().blob()
      total += blob.size
    }
  }

  return total
}

async function clearNativeCache(): Promise<void> {
  const { files } = await Filesystem.readdir({ directory: CACHE_DIR, path: '' })

  for (const file of files) {
    if (file.type === 'directory')
      await Filesystem.rmdir({ directory: CACHE_DIR, path: file.name, recursive: true })
    else
      await Filesystem.deleteFile({ directory: CACHE_DIR, path: file.name })
  }
}

export function useCache() {
  // --- STATE ---
  const cacheSize = ref<number>(0)
  const isCalculating = ref<boolean>(false)
  const isClearing = ref<boolean>(false)

  const formattedCacheSize = computed(() => formatBytes(cacheSize.value))

  // --- ACTIONS ---
  async function calculateCacheSize() {
    isCalculating.value = true
    try {
      if (Capacitor.isNativePlatform()) {
        // Временный кеш WebView (кеш карты вынесен в отдельное поле — useMapCache)
        cacheSize.value = await calcNativeDirSize('')
      }
      else {
        // Веб/PWA: реальный размер Cache Storage
        cacheSize.value = await calcWebCacheSize()
      }
    }
    catch (error) {
      console.error('[Cache] Не удалось посчитать размер кеша:', error)
      cacheSize.value = 0
    }
    finally {
      isCalculating.value = false
    }
  }

  async function clearCache() {
    isClearing.value = true
    try {
      if (Capacitor.isNativePlatform()) {
        await clearNativeCache()
      }
      else if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
      }
      await calculateCacheSize()
    }
    catch (error) {
      console.error('[Cache] Не удалось очистить кеш:', error)
    }
    finally {
      isClearing.value = false
    }
  }

  return {
    cacheSize,
    formattedCacheSize,
    isCalculating,
    isClearing,
    calculateCacheSize,
    clearCache,
  }
}
