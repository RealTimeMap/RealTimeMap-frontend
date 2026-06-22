import type { MapPoint } from '@/types/shared/map'
import { ref } from 'vue'

export function useGeocoding() {
  const address = ref('')
  const isLoading = ref(false)

  const fetchAddress = async (coords: MapPoint) => {
    if (!coords)
      return

    isLoading.value = true
    try {
      const geocode = `${coords[0]},${coords[1]}`
      const apiKey = import.meta.env.VITE_YANDEX_GEOCODER_KEY

      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${geocode}&format=json&results=1`,
      )

      const data = await response.json()

      const featureMember = data.response.GeoObjectCollection.featureMember[0]

      if (featureMember) {
        address.value = featureMember.GeoObject.name
      }
      else {
        address.value = 'Адрес не найден'
      }
    }
    catch (err) {
      console.error('Geocoding error:', err)
      address.value = 'Ошибка получения адреса'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    address,
    isLoading,
    fetchAddress,
  }
}
