import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

const COOKIE = {
  public: 'map_layer_public',
  personal: 'map_layer_personal',
  heatmap: 'map_layer_heatmap',
  buildings: 'map_layer_buildings3d',
  previewSwipe: 'map_preview_swipe',
  nearbyStrip: 'map_nearby_strip',
} as const

const read = (name: string) => getCookie(name) !== 'false'
const readOptIn = (name: string) => getCookie(name) === 'true'

export function useMapLayers() {
  const showPublicMarks = ref(read(COOKIE.public))
  const showPersonalMarks = ref(read(COOKIE.personal))
  const showHeatmap = ref(readOptIn(COOKIE.heatmap))
  const showBuildings3D = ref(readOptIn(COOKIE.buildings))
  const markPreviewSwipe = ref(read(COOKIE.previewSwipe))
  const showNearbyStrip = ref(read(COOKIE.nearbyStrip))

  watch(showPublicMarks, v => setCookie(COOKIE.public, String(v), 365))
  watch(showPersonalMarks, v => setCookie(COOKIE.personal, String(v), 365))
  watch(showHeatmap, v => setCookie(COOKIE.heatmap, String(v), 365))
  watch(showBuildings3D, v => setCookie(COOKIE.buildings, String(v), 365))
  watch(markPreviewSwipe, v => setCookie(COOKIE.previewSwipe, String(v), 365))
  watch(showNearbyStrip, v => setCookie(COOKIE.nearbyStrip, String(v), 365))

  return {
    showPublicMarks,
    showPersonalMarks,
    showHeatmap,
    showBuildings3D,
    markPreviewSwipe,
    showNearbyStrip,
  }
}
