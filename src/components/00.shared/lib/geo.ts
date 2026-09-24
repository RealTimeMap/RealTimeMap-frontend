import type { MapPoint } from '@/types/shared/map'

/** Расстояние по поверхности Земли (haversine), в метрах. Точки в формате [lon, lat]. */
export function distanceMeters(a: MapPoint, b: MapPoint): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h
    = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(meters: number): string {
  if (meters < 1000)
    return `${Math.round(meters)} м`
  return `${(meters / 1000).toFixed(1)} км`
}
