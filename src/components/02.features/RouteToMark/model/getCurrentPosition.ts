import type { MapPoint } from '@/types/shared/map'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export async function getCurrentPosition(): Promise<MapPoint | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      })
      return [pos.coords.longitude, pos.coords.latitude]
    }

    if ('geolocation' in navigator) {
      return await new Promise<MapPoint | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve([pos.coords.longitude, pos.coords.latitude]),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
        )
      })
    }

    return null
  }
  catch {
    return null
  }
}
