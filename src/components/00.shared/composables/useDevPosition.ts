import type { MapPoint } from '@/types/shared/map'

export function useDevPosition() {
  const isDev = import.meta.env.DEV

  const devPosition = isDev
    ? [Number(import.meta.env.VITE_DEV_LNG), Number(import.meta.env.VITE_DEV_LAT)] as MapPoint
    : null

  return { devPosition, isDev }
}
