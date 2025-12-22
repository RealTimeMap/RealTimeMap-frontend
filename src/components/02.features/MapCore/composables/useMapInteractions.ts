import type { LngLat, YMap } from '@yandex/ymaps3-types'
import type { ShallowRef } from 'vue'

export function useMapInteractions(mapInstance: ShallowRef<YMap | null>) {
  const markers = ref<any[]>([])

  const addMarker = (coordinates: LngLat) => {
    if (!mapInstance.value)
      return
    // markers.value.push(...)
    console.error('Adding marker at:', coordinates, 'on map:', mapInstance.value)
  }

  // ... другие функции взаимодействия

  return {
    markers,
    addMarker,
  }
}
