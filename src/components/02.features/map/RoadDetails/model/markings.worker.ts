import type { MarkingsRequest } from './markings'
import { serveLatest } from '@/components/00.shared/lib/latestWorker'
import { computeMarkings } from './markings'

serveLatest<MarkingsRequest, GeoJSON.FeatureCollection>(computeMarkings)
