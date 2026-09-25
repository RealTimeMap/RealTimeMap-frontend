import type { ShadowArea } from './useBuildingsLayer'
import type { SunPosition } from '@/components/00.shared/lib/sun'
import { serveLatest } from '@/components/00.shared/lib/latestWorker'
import { buildShadows } from './useBuildingsLayer'

serveLatest<{ features: GeoJSON.Feature[], sun: SunPosition, lat: number, area: ShadowArea }, GeoJSON.FeatureCollection>(
  ({ features, sun, lat, area }) => buildShadows(features, sun, lat, area),
)
