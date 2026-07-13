import type { MapPoint } from '@/types/shared/map'
import { Geolocation } from '@capacitor/geolocation'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDevPosition } from '@/components/00.shared/composables/useDevPosition'

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

  const fetchGeolocation = async () => {
    isLoading.value = true
    error.value = null

    if (isNativeCapacitor.value) {
      try {
        const permissions = await Geolocation.requestPermissions({
          permissions: ['location'],
        })

        if (permissions.location !== 'granted') {
          error.value = 'Доступ к геопозиции отклонен на устройстве.'
          isLoading.value = false
          return
        }

        capWatchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          },
          (position, err) => {
            if (err) {
              error.value = `Ошибка мобильной геолокации: ${err.message}`
              isLoading.value = false
              return
            }
            if (position) {
              userPosition.value = [position.coords.longitude, position.coords.latitude]
              isLoading.value = false
            }
          },
        )
      }
      catch (err: any) {
        error.value = `Не удалось запустить мобильный трекинг: ${err.message || err}`
        isLoading.value = false
      }
    }
    else {
      if ('geolocation' in navigator) {
        webWatchId = navigator.geolocation.watchPosition(
          (position) => {
            userPosition.value = [position.coords.longitude, position.coords.latitude]
            isLoading.value = false
          },
          (err) => {
            if (isDev) {
              userPosition.value = devPosition
            }
            else {
              error.value = `Ошибка браузерной геолокации: ${err.message}`
            }
            isLoading.value = false
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
