import type { MapPoint } from '@/types/shared/map'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export type PositionCallback = (pos: MapPoint) => void

export interface PositionWatcher {
  clear: () => void
}

export async function watchPosition(cb: PositionCallback): Promise<PositionWatcher> {
  if (Capacitor.isNativePlatform()) {
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000 },
      (pos, err) => {
        if (err || !pos)
          return
        cb([pos.coords.longitude, pos.coords.latitude])
      },
    )
    return { clear: () => Geolocation.clearWatch({ id }) }
  }

  if ('geolocation' in navigator) {
    const id = navigator.geolocation.watchPosition(
      pos => cb([pos.coords.longitude, pos.coords.latitude]),
      () => { },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    )
    return { clear: () => navigator.geolocation.clearWatch(id) }
  }

  return { clear: () => { } }
}
