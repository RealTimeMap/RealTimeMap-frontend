import type { LngLat, Map } from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import maplibregl from 'maplibre-gl'

export function useMapInteractions(mapInstance: ShallowRef<Map | null>) {
  const addMarker = (coordinates: LngLat) => {
    if (!mapInstance.value)
      return

    new maplibregl.Marker()
      .setLngLat(coordinates)
      .addTo(mapInstance.value)
  }

  return { addMarker }
}
