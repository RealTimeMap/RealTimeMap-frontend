import type { ViewBounds } from './trees'
import { serveLatest } from '@/components/00.shared/lib/latestWorker'
import { plantTrees } from './trees'

serveLatest<{ features: GeoJSON.Feature[], area: ViewBounds }, GeoJSON.FeatureCollection>(
  ({ features, area }) => plantTrees(features, area),
)
