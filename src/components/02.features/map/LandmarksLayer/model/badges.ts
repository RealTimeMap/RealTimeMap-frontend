import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Landmark } from './landmarks'
import type { ThemeBase } from '@/components/00.shared/lib/theme'

// --- Значки достопримечательностей ---
// Издалека модель меньше пикселя — вместо неё золотистый жетон с названием.
// Вблизи жетон уступает место модели, у подножия остаётся только подпись

export const POINTS_SOURCE_ID = 'landmarks-points'
export const BADGE_LAYER_ID = 'landmarks-badge'
export const LABEL_LAYER_ID = 'landmarks-label'
const BADGE_IMAGE = 'landmark-badge'
/** С этого зума модель уже видна — жетон сменяется подписью. */
export const MODEL_ZOOM = 14
/** Дальше — масштаб страны: жетоны соседних мест слипаются. */
const BADGE_MIN_ZOOM = 8

const BADGE_SIZE = 40
const PIXEL_RATIO = 2

const TEXT: Record<ThemeBase, { color: string, halo: string }> = {
  light: { color: '#4a3b1c', halo: '#ffffff' },
  dark: { color: '#f3e3b8', halo: '#16181d' },
}

/** Жетон: золотой круг с белой каймой и силуэтом здания с колоннами. */
function drawBadge(): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = BADGE_SIZE * PIXEL_RATIO
  const ctx = canvas.getContext('2d')!
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO)
  const center = BADGE_SIZE / 2
  const radius = 15

  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 1
  const gold = ctx.createLinearGradient(0, center - radius, 0, center + radius)
  gold.addColorStop(0, '#f9d56e')
  gold.addColorStop(1, '#e09b2d')
  ctx.fillStyle = gold
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 2
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()

  // Фронтон, три колонны и ступень
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(center - 9, center - 3)
  ctx.lineTo(center, center - 9)
  ctx.lineTo(center + 9, center - 3)
  ctx.closePath()
  ctx.fill()
  for (const x of [-6.5, -1.25, 4])
    ctx.fillRect(center + x, center - 1.5, 2.5, 7.5)
  ctx.fillRect(center - 9, center + 6.5, 18, 2.2)

  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function points(landmarks: Landmark[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: landmarks.filter(landmark => landmark.modelUrl).map(landmark => ({
      type: 'Feature',
      properties: { id: landmark.id, title: landmark.title },
      geometry: { type: 'Point', coordinates: landmark.coordinates },
    })),
  }
}

/**
 * Шрифт берём у подписей самого стиля — другого набора глифов на сервере карты может не быть.
 * Курсив в стиле у воды и природы — для названия здания нужен прямой.
 */
function textFont(instance: MapLibreMap): string[] {
  for (const layer of instance.getStyle().layers) {
    const font = layer.type === 'symbol' ? layer.layout?.['text-font'] : undefined
    if (Array.isArray(font) && font.every(item => typeof item === 'string' && !item.includes('Italic')))
      return font as string[]
  }
  return ['Open Sans Regular']
}

/** Слои и картинка живут в стиле: после смены темы их нужно вернуть. */
export function ensureBadges(instance: MapLibreMap, landmarks: Landmark[], base: ThemeBase) {
  if (!instance.hasImage(BADGE_IMAGE))
    instance.addImage(BADGE_IMAGE, drawBadge(), { pixelRatio: PIXEL_RATIO })
  if (!instance.getSource(POINTS_SOURCE_ID))
    instance.addSource(POINTS_SOURCE_ID, { type: 'geojson', data: points(landmarks) })
  const font = textFont(instance)
  const text = TEXT[base]
  if (!instance.getLayer(BADGE_LAYER_ID)) {
    instance.addLayer({
      id: BADGE_LAYER_ID,
      type: 'symbol',
      source: POINTS_SOURCE_ID,
      minzoom: BADGE_MIN_ZOOM,
      maxzoom: MODEL_ZOOM,
      layout: {
        'icon-image': BADGE_IMAGE,
        'icon-allow-overlap': true,
        'text-field': ['get', 'title'],
        'text-font': font,
        'text-size': 12,
        'text-anchor': 'top',
        'text-offset': [0, 1.5],
        'text-optional': true,
      },
      paint: { 'text-color': text.color, 'text-halo-color': text.halo, 'text-halo-width': 1.5 },
    })
  }
  if (!instance.getLayer(LABEL_LAYER_ID)) {
    instance.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: POINTS_SOURCE_ID,
      minzoom: MODEL_ZOOM,
      layout: {
        'text-field': ['get', 'title'],
        'text-font': font,
        'text-size': 13,
        'text-anchor': 'top',
        'text-offset': [0, 0.8],
        'text-allow-overlap': true,
      },
      paint: { 'text-color': text.color, 'text-halo-color': text.halo, 'text-halo-width': 1.8 },
    })
  }
}

export function recolorBadges(instance: MapLibreMap, base: ThemeBase) {
  const text = TEXT[base]
  for (const id of [BADGE_LAYER_ID, LABEL_LAYER_ID]) {
    if (!instance.getLayer(id))
      continue
    instance.setPaintProperty(id, 'text-color', text.color)
    instance.setPaintProperty(id, 'text-halo-color', text.halo)
  }
}

/** Подпись выбранного здания прячем: название уже в карточке, а у подножия подпись ложится поверх модели. */
export function hideLabel(instance: MapLibreMap, id: string | null) {
  if (instance.getLayer(LABEL_LAYER_ID))
    instance.setFilter(LABEL_LAYER_ID, id ? ['!=', ['get', 'id'], id] : null)
}

export function removeBadges(instance: MapLibreMap) {
  for (const id of [BADGE_LAYER_ID, LABEL_LAYER_ID]) {
    if (instance.getLayer(id))
      instance.removeLayer(id)
  }
  if (instance.getSource(POINTS_SOURCE_ID))
    instance.removeSource(POINTS_SOURCE_ID)
}
