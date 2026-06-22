import type { MapPoint } from '@/types/shared/map'

export const useAddMarkStore = defineStore('add-mark', () => {
  const isAddingMark = ref(false)
  const markerCoords = shallowRef<MapPoint | null>(null)

  const startAddingMark = (initialCoords: MapPoint) => {
    isAddingMark.value = true
    markerCoords.value = initialCoords
  }

  const stopAddingMark = () => {
    isAddingMark.value = false
    markerCoords.value = null
  }

  const setMarkerCoords = (coords: MapPoint) => {
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
