import type { MapPoint } from '@/types/shared/map'
import { useDevPosition } from '@/composables/useDevPosition'

export function useGeolocation() {
  const { devPosition, isDev } = useDevPosition()
  const userPosition = ref<MapPoint | null>(devPosition)
  const error = ref<string | null>(null)
  const isLoading = ref<boolean>(!devPosition)

  const fetchGeolocation = () => {
    isLoading.value = true
    error.value = null
    userPosition.value = null

    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          userPosition.value = [lng, lat]
          isLoading.value = false
        },
        (err) => {
          error.value = `Error getting geolocation: ${err.message}`
          console.error(error.value)
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
      error.value = 'Геолокация не поддерживается в этом браузере.'
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (!isDev)
      fetchGeolocation()
  })

  return {
    userPosition,
    error,
    isLoading,
  }
}
