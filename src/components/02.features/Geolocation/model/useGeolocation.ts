import type { MapPoint } from '@/types/shared/map'
import { Geolocation } from '@capacitor/geolocation'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDevPosition } from '@/components/00.shared/composables/useDevPosition'
import { requestPermissionInQueue } from '@/components/00.shared/lib/permissions'

export function useGeolocation() {
  const { devPosition, isDev } = useDevPosition()

  const userPosition = ref<MapPoint | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref<boolean>(true)

  let capWatchId: string | null = null
  let webWatchId: number | null = null

  const isNativeCapacitor = computed(() => {
    const cap = (window as any).Capacitor
    return !!(cap && cap.isNativePlatform())
  })

  interface Coords { coords: { longitude: number, latitude: number } }

  const applyPosition = (position: Coords) => {
    userPosition.value = [position.coords.longitude, position.coords.latitude]
    error.value = null
    isLoading.value = false
  }

  /**
   * Ошибку показываем, только пока не получили ни одной позиции.
   * Иначе временный сбой watchPosition (частый на iOS: потеря сигнала,
   * таймаут высокой точности) убрал бы уже работающую карту.
   */
  const handleError = (message: string) => {
    if (userPosition.value) {
      console.warn('[geolocation]', message)
      return
    }
    error.value = message
    isLoading.value = false
  }

  const fetchGeolocation = async () => {
    isLoading.value = true
    error.value = null

    if (isNativeCapacitor.value) {
      try {
        const permissions = await requestPermissionInQueue(() =>
          Geolocation.requestPermissions({ permissions: ['location'] }),
        )

        if (permissions.location !== 'granted') {
          error.value = 'Доступ к геопозиции отклонен на устройстве.'
          isLoading.value = false
          return
        }

        try {
          const first = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          })
          applyPosition(first)
        }
        catch { }

        capWatchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          },
          (position, err) => {
            if (err) {
              handleError(`Ошибка мобильной геолокации: ${err.message}`)
              return
            }
            if (position)
              applyPosition(position)
          },
        )
      }
      catch (err: any) {
        handleError(`Не удалось запустить мобильный трекинг: ${err.message || err}`)
      }
    }
    else {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          applyPosition,
          () => { /* нет кэша — уточнит watchPosition */ },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
        )

        webWatchId = navigator.geolocation.watchPosition(
          applyPosition,
          (err) => {
            if (isDev) {
              userPosition.value = devPosition
              isLoading.value = false
            }
            else {
              handleError(`Ошибка браузерной геолокации: ${err.message}`)
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          },
        )
      }
      else {
        error.value = 'Геолокация не поддерживается этим браузером.'
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    fetchGeolocation()
  })

  onUnmounted(async () => {
    if (isNativeCapacitor.value && capWatchId) {
      try {
        await Geolocation.clearWatch({ id: capWatchId })
      }
      catch (err) {
        console.error('Ошибка при остановке мобильного трекинга:', err)
      }
    }
    if (!isNativeCapacitor.value && webWatchId !== null) {
      navigator.geolocation.clearWatch(webWatchId)
    }
  })

  return {
    userPosition,
    error,
    isLoading,
  }
}
