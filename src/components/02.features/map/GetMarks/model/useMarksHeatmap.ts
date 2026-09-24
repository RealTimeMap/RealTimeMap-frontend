import type { ExpressionSpecification, GeoJSONSource, HeatmapLayerSpecification, Map } from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { ThemeName } from '@/components/00.shared/lib/theme'
import { themeBase } from '@/components/00.shared/lib/theme'
import { mixRgb, onThemeApplied, readThemeColor, rgba } from '@/components/00.shared/lib/themeColors'

const SOURCE_ID = 'marks-heat'
const LAYER_ID = 'marks-heat'

/**
 * Палитра из цветов текущей темы. «Горячее» ядро в тёмных темах светлее,
 * в светлых — темнее: иначе оно теряется на фоне карты.
 */
function heatmapColor(): ExpressionSpecification {
  const primary = readThemeColor('--primary-color')
  const secondary = readThemeColor('--secondary-color', primary)
  const theme = (document.documentElement.dataset.theme ?? 'light') as ThemeName
  const core = themeBase(theme) === 'dark'
    ? mixRgb(secondary, [255, 255, 255], 0.5)
    : mixRgb(primary, [0, 0, 0], 0.3)
  return [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    rgba(primary, 0),
    0.2,
    rgba(primary, 0.3),
    0.45,
    rgba(primary, 0.55),
    0.7,
    rgba(secondary, 0.75),
    1,
    rgba(core, 0.95),
  ]
}

function heatmapLayer(): HeatmapLayerSpecification {
  return {
    id: LAYER_ID,
    type: 'heatmap',
    source: SOURCE_ID,
    paint: {
      // Кластер из сотни меток горячее одиночной, но не в сто раз
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 1, 0.25, 10, 0.6, 100, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 14, 2],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 18, 9, 32, 15, 48],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.85, 16, 0.4],
      'heatmap-color': heatmapColor(),
    },
  }
}

type Coordinates = readonly [number, number]

interface HeatPoints {
  marks: ReadonlyArray<{ geom: { coordinates: Coordinates } }>
  clusters: ReadonlyArray<{ center: { coordinates: Coordinates }, count: number }>
}

function toFeatureCollection({ marks, clusters }: HeatPoints): GeoJSON.FeatureCollection<GeoJSON.Point, { weight: number }> {
  const point = (coordinates: Coordinates, weight: number): GeoJSON.Feature<GeoJSON.Point, { weight: number }> => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [coordinates[0], coordinates[1]] },
    properties: { weight },
  })
  return {
    type: 'FeatureCollection',
    features: [
      ...clusters.map(c => point(c.center.coordinates, c.count)),
      ...marks.map(m => point(m.geom.coordinates, 1)),
    ],
  }
}

/** Тепловая карта активности по меткам и кластерам сервера — вместо кружков-кластеров. */
export function useMarksHeatmap(
  map: ShallowRef<Map | null> | undefined,
  points: () => HeatPoints,
  enabled: () => boolean,
) {
  function remove(instance: Map) {
    if (instance.getLayer(LAYER_ID))
      instance.removeLayer(LAYER_ID)
    if (instance.getSource(SOURCE_ID))
      instance.removeSource(SOURCE_ID)
  }

  let waitingForIdle = false

  function sync() {
    const instance = map?.value
    if (!instance)
      return
    // isStyleLoaded() ложно и пока грузятся тайлы — дожидаемся idle, а не теряем вызов
    if (!instance.isStyleLoaded()) {
      if (!waitingForIdle) {
        waitingForIdle = true
        instance.once('idle', () => {
          waitingForIdle = false
          sync()
        })
      }
      return
    }
    if (!enabled()) {
      remove(instance)
      return
    }

    const data = toFeatureCollection(points())
    const source = instance.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (source)
      source.setData(data)
    else
      instance.addSource(SOURCE_ID, { type: 'geojson', data })

    ensureLayer(instance)
  }

  // Под подписями, чтобы названия улиц оставались читаемыми.
  // Двигаем только при неверном порядке: moveLayer сам вызывает styledata
  function ensureLayer(instance: Map) {
    if (!enabled() || !instance.isStyleLoaded() || !instance.getSource(SOURCE_ID))
      return
    const layers = instance.getStyle().layers
    const firstSymbol = layers.find(layer => layer.type === 'symbol')?.id
    if (!instance.getLayer(LAYER_ID)) {
      instance.addLayer(heatmapLayer(), firstSymbol)
      return
    }
    const own = layers.findIndex(layer => layer.id === LAYER_ID)
    const target = firstSymbol ? layers.findIndex(layer => layer.id === firstSymbol) : layers.length
    if (own > target)
      instance.moveLayer(LAYER_ID, firstSymbol)
  }

  function onStyleData() {
    const instance = map?.value
    if (!instance || !enabled())
      return
    // После полной замены стиля источника нет — пересоздаём вместе с данными
    if (!instance.getSource(SOURCE_ID))
      sync()
    else
      ensureLayer(instance)
  }

  watch([() => map?.value, enabled, points], sync, { immediate: true })

  // Смена темы (setStyle с diff) даёт только styledata, style.load не приходит
  watch(() => map?.value, (instance, previous) => {
    previous?.off('styledata', onStyleData)
    instance?.on('styledata', onStyleData)
  }, { immediate: true })

  // Смена темы: палитра берётся из CSS-переменных новой темы
  const stopThemeWatch = onThemeApplied(() => {
    const instance = map?.value
    if (instance?.getLayer(LAYER_ID))
      instance.setPaintProperty(LAYER_ID, 'heatmap-color', heatmapColor())
  })

  onUnmounted(() => {
    stopThemeWatch()
    const instance = map?.value
    if (!instance)
      return
    instance.off('styledata', onStyleData)
    remove(instance)
  })
}
