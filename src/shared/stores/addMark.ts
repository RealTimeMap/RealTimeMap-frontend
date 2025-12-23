import type { LngLat } from '@yandex/ymaps3-types'

export const useAddMarkStore = defineStore('add-mark', () => {
  const isAddingMark = ref(false)
  const markerCoords = shallowRef<LngLat | null>(null)

  const startAddingMark = (initialCoords: LngLat) => {
    isAddingMark.value = true
    markerCoords.value = initialCoords
  }

  const stopAddingMark = () => {
    isAddingMark.value = false
    markerCoords.value = null
  }

  const setMarkerCoords = (coords: LngLat) => {
    markerCoords.value = coords
  }

  return {
    isAddingMark,
    markerCoords,
    startAddingMark,
    stopAddingMark,
    setMarkerCoords,
  }
})
