import type { Feature, LineString } from 'geojson'
import type { MapPoint } from '@/types/shared/map'

export type RouteProfile = 'foot-walking' | 'cycling-regular' | 'driving-car'

export interface RouteResult {
  geojson: Feature<LineString>
  distance: number
  duration: number
}

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions'

export async function fetchRoute(
  start: MapPoint,
  end: MapPoint,
  profile: RouteProfile = 'foot-walking',
): Promise<RouteResult> {
  const apiKey = import.meta.env.VITE_ORS_KEY as string | undefined
  if (!apiKey)
    throw new Error('Не задан VITE_ORS_KEY')

  const response = await fetch(`${ORS_BASE}/${profile}/geojson`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coordinates: [start, end] }),
  })

  if (!response.ok)
    throw new Error(`ORS ${response.status}`)

  const data = await response.json()
  const feature = data?.features?.[0]
  if (!feature)
    throw new Error('Маршрут не найден')

  const summary = feature.properties?.summary ?? {}
  return {
    geojson: feature,
    distance: summary.distance ?? 0,
    duration: summary.duration ?? 0,
  }
}
