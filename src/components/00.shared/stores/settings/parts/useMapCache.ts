import { formatBytes } from '@/components/00.shared/lib/formatBytes'
import {
  clear as clearMapCacheFiles,
  getSize as getMapCacheSize,
} from '@/components/00.shared/lib/mapCache'

export function useMapCache() {
  // --- STATE ---
  const mapCacheSize = ref<number>(0)
  const isCalculatingMap = ref<boolean>(false)
  const isClearingMap = ref<boolean>(false)

  const formattedMapCacheSize = computed(() => formatBytes(mapCacheSize.value))

  // --- ACTIONS ---
  async function calculateMapCacheSize() {
    isCalculatingMap.value = true
    try {
      mapCacheSize.value = await getMapCacheSize()
    }
    catch (error) {
      console.error('[MapCache] Не удалось посчитать размер кеша карты:', error)
      mapCacheSize.value = 0
    }
    finally {
      isCalculatingMap.value = false
    }
  }

  async function clearMapCache() {
    isClearingMap.value = true
    try {
      await clearMapCacheFiles()
      await calculateMapCacheSize()
    }
    finally {
      isClearingMap.value = false
    }
  }

  return {
    mapCacheSize,
    formattedMapCacheSize,
    isCalculatingMap,
    isClearingMap,
    calculateMapCacheSize,
    clearMapCache,
  }
}
