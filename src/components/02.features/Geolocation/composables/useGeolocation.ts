import type { LngLat } from '@yandex/ymaps3-types'

export function useGeolocation() {
  const userPosition = ref<LngLat | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref<boolean>(true)

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
    fetchGeolocation()
  })

  return {
    userPosition,
    error,
    isLoading,
  }
}
