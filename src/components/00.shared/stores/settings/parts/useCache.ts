function formatBytes(bytes: number): string {
  if (bytes <= 0)
    return '0 Б'

  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** i

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function useCache() {
  // --- STATE ---
  const cacheSize = ref<number>(0)
  const isCalculating = ref<boolean>(false)
  const isClearing = ref<boolean>(false)

  const formattedCacheSize = computed(() => formatBytes(cacheSize.value))

  // --- ACTIONS ---
  async function calculateCacheSize() {
    if (!('storage' in navigator) || !navigator.storage.estimate) {
      cacheSize.value = 0
      return
    }

    isCalculating.value = true
    try {
      const { usage } = await navigator.storage.estimate()
      cacheSize.value = usage ?? 0
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
    if (!('caches' in window))
      return

    isClearing.value = true
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
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
