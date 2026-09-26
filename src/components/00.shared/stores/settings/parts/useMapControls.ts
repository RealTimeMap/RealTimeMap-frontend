import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

const COOKIE = {
  zoom: 'map_ctrl_zoom',
  locate: 'map_ctrl_locate',
  settings: 'map_ctrl_settings',
  zoomLevel: 'map_ctrl_zoomlevel',
  pitch: 'map_ctrl_pitch',
  surprise: 'map_ctrl_surprise',
  layers: 'map_ctrl_layers',
  editor: 'map_ctrl_editor',
} as const

const read = (name: string) => getCookie(name) !== 'false'

export function useMapControls() {
  // По умолчанию все кнопки видимы
  const showMapZoom = ref(read(COOKIE.zoom))
  const showMapLocate = ref(read(COOKIE.locate))
  const showMapSettings = ref(read(COOKIE.settings))
  const showMapZoomLevel = ref(read(COOKIE.zoomLevel))
  const showMapPitch = ref(read(COOKIE.pitch))
  const showMapSurprise = ref(read(COOKIE.surprise))
  const showMapLayers = ref(read(COOKIE.layers))
  const showMapEditor = ref(read(COOKIE.editor))

  watch(showMapZoom, v => setCookie(COOKIE.zoom, String(v), 365))
  watch(showMapLocate, v => setCookie(COOKIE.locate, String(v), 365))
  watch(showMapSettings, v => setCookie(COOKIE.settings, String(v), 365))
  watch(showMapZoomLevel, v => setCookie(COOKIE.zoomLevel, String(v), 365))
  watch(showMapPitch, v => setCookie(COOKIE.pitch, String(v), 365))
  watch(showMapSurprise, v => setCookie(COOKIE.surprise, String(v), 365))
  watch(showMapLayers, v => setCookie(COOKIE.layers, String(v), 365))
  watch(showMapEditor, v => setCookie(COOKIE.editor, String(v), 365))

  return {
    showMapZoom,
    showMapLocate,
    showMapSettings,
    showMapZoomLevel,
    showMapPitch,
    showMapSurprise,
    showMapLayers,
    showMapEditor,
  }
}
