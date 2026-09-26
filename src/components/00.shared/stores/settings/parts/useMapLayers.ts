import type { Season } from '@/components/00.shared/lib/season'
import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

const COOKIE = {
  public: 'map_layer_public',
  personal: 'map_layer_personal',
  heatmap: 'map_layer_heatmap',
  buildings: 'map_layer_buildings3d',
  previewSwipe: 'map_preview_swipe',
  nearbyStrip: 'map_nearby_strip',
  season: 'map_season',
  trees: 'map_layer_trees',
  water: 'map_water_motion',
  weather: 'map_weather',
  weatherEffects: 'map_weather_fx',
} as const

/** auto — по дате и широте, off — исходные цвета стиля, иначе — выбранный сезон. */
export type MapSeasonMode = 'auto' | 'off' | Season

const SEASON_MODES: MapSeasonMode[] = ['auto', 'off', 'spring', 'summer', 'autumn', 'winter']

const read = (name: string) => getCookie(name) !== 'false'
const readOptIn = (name: string) => getCookie(name) === 'true'

export function useMapLayers() {
  const showPublicMarks = ref(read(COOKIE.public))
  const showPersonalMarks = ref(read(COOKIE.personal))
  const showHeatmap = ref(readOptIn(COOKIE.heatmap))
  const showBuildings3D = ref(readOptIn(COOKIE.buildings))
  const showTrees = ref(readOptIn(COOKIE.trees))
  const animateWater = ref(readOptIn(COOKIE.water))
  const showWeather = ref(read(COOKIE.weather))
  const showWeatherEffects = ref(read(COOKIE.weatherEffects))
  const markPreviewSwipe = ref(read(COOKIE.previewSwipe))
  const showNearbyStrip = ref(read(COOKIE.nearbyStrip))
  const storedSeason = getCookie(COOKIE.season) as MapSeasonMode | null
  const mapSeason = ref<MapSeasonMode>(storedSeason && SEASON_MODES.includes(storedSeason) ? storedSeason : 'auto')

  watch(showPublicMarks, v => setCookie(COOKIE.public, String(v), 365))
  watch(showPersonalMarks, v => setCookie(COOKIE.personal, String(v), 365))
  watch(showHeatmap, v => setCookie(COOKIE.heatmap, String(v), 365))
  watch(showBuildings3D, v => setCookie(COOKIE.buildings, String(v), 365))
  watch(showTrees, v => setCookie(COOKIE.trees, String(v), 365))
  watch(animateWater, v => setCookie(COOKIE.water, String(v), 365))
  watch(showWeather, v => setCookie(COOKIE.weather, String(v), 365))
  watch(showWeatherEffects, v => setCookie(COOKIE.weatherEffects, String(v), 365))
  watch(markPreviewSwipe, v => setCookie(COOKIE.previewSwipe, String(v), 365))
  watch(showNearbyStrip, v => setCookie(COOKIE.nearbyStrip, String(v), 365))
  watch(mapSeason, v => setCookie(COOKIE.season, v, 365))

  return {
    showPublicMarks,
    showPersonalMarks,
    showHeatmap,
    showBuildings3D,
    showTrees,
    animateWater,
    showWeather,
    showWeatherEffects,
    markPreviewSwipe,
    showNearbyStrip,
    mapSeason,
  }
}
