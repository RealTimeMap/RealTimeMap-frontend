import type { Planting, ViewBounds } from './trees'
import { serveLatest } from '@/components/00.shared/lib/latestWorker'
import { plantTrees } from './trees'

serveLatest<{ features: GeoJSON.Feature[], buildings: GeoJSON.Feature[], area: ViewBounds }, Planting>(
  ({ features, buildings, area }) => plantTrees(features, area, buildings),
)
