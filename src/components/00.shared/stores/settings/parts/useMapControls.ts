import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

const COOKIE = {
  zoom: 'map_ctrl_zoom',
  locate: 'map_ctrl_locate',
  settings: 'map_ctrl_settings',
  zoomLevel: 'map_ctrl_zoomlevel',
} as const

const read = (name: string) => getCookie(name) !== 'false'

export function useMapControls() {
  // По умолчанию все кнопки видимы
  const showMapZoom = ref(read(COOKIE.zoom))
  const showMapLocate = ref(read(COOKIE.locate))
  const showMapSettings = ref(read(COOKIE.settings))
  const showMapZoomLevel = ref(read(COOKIE.zoomLevel))

  watch(showMapZoom, v => setCookie(COOKIE.zoom, String(v), 365))
  watch(showMapLocate, v => setCookie(COOKIE.locate, String(v), 365))
  watch(showMapSettings, v => setCookie(COOKIE.settings, String(v), 365))
  watch(showMapZoomLevel, v => setCookie(COOKIE.zoomLevel, String(v), 365))

  return {
    showMapZoom,
    showMapLocate,
    showMapSettings,
    showMapZoomLevel,
  }
}
