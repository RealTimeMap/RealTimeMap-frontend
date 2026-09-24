import type { MapPoint } from '@/types/shared/map'
import { Geolocation } from '@capacitor/geolocation'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDevPosition } from '@/components/00.shared/composables/useDevPosition'
import { requestPermissionInQueue } from '@/components/00.shared/lib/permissions'

export function useGeolocation() {
  const { devPosition, isDev } = useDevPosition()

  type GeoErrorReason = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'generic'

  const userPosition = ref<MapPoint | null>(null)
  const error = ref<string | null>(null)
  const errorReason = ref<GeoErrorReason | null>(null)
  const isLoading = ref<boolean>(true)

  let capWatchId: string | null = null
  let webWatchId: number | null = null

  const isNativeCapacitor = computed(() => {
    const cap = (window as any).Capacitor
    return !!(cap && cap.isNativePlatform())
  })

  const clearWatchers = async () => {
    if (isNativeCapacitor.value && capWatchId) {
      try {
        await Geolocation.clearWatch({ id: capWatchId })
      }
      catch (err) {
        console.error('Ошибка при остановке мобильного трекинга:', err)
      }
      capWatchId = null
    }
    if (!isNativeCapacitor.value && webWatchId !== null) {
      navigator.geolocation.clearWatch(webWatchId)
      webWatchId = null
    }
  }

  interface Coords { coords: { longitude: number, latitude: number } }

  const applyPosition = (position: Coords) => {
    userPosition.value = [position.coords.longitude, position.coords.latitude]
    error.value = null
    errorReason.value = null
    isLoading.value = false
  }

  const reasonFromCode = (code?: number): GeoErrorReason => {
    switch (code) {
      case 1: return 'denied'
      case 2: return 'unavailable'
      case 3: return 'timeout'
      default: return 'generic'
    }
  }

  const handleError = (message: string, reason: GeoErrorReason = 'generic') => {
    if (userPosition.value) {
      console.warn('[geolocation]', message)
      return
    }
    error.value = message
    errorReason.value = reason
    isLoading.value = false
  }

  const fetchGeolocation = async () => {
    isLoading.value = true
    error.value = null
    errorReason.value = null

    await clearWatchers()

    if (isNativeCapacitor.value) {
      try {
        const permissions = await requestPermissionInQueue(() =>
          Geolocation.requestPermissions({ permissions: ['location'] }),
        )

        if (permissions.location !== 'granted') {
          error.value = 'Доступ к геопозиции отклонён на устройстве.'
          errorReason.value = 'denied'
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
              handleError(
                `Ошибка мобильной геолокации: ${err.message}`,
                reasonFromCode((err as any).code),
              )
              return
            }
            if (position)
              applyPosition(position)
          },
        )
      }
      catch (err: any) {
        handleError(
          `Не удалось запустить мобильный трекинг: ${err.message || err}`,
          reasonFromCode(err?.code),
        )
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
              handleError(`Ошибка браузерной геолокации: ${err.message}`, reasonFromCode(err.code))
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
        errorReason.value = 'unsupported'
        isLoading.value = false
      }
    }
  }

  const retry = () => fetchGeolocation()

  onMounted(() => {
    fetchGeolocation()
  })

  onUnmounted(() => {
    clearWatchers()
  })

  return {
    userPosition,
    error,
    errorReason,
    isLoading,
    retry,
  }
}
