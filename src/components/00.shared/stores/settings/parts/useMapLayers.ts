import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

const COOKIE = {
  public: 'map_layer_public',
  personal: 'map_layer_personal',
} as const

const read = (name: string) => getCookie(name) !== 'false'

export function useMapLayers() {
  const showPublicMarks = ref(read(COOKIE.public))
  const showPersonalMarks = ref(read(COOKIE.personal))

  watch(showPublicMarks, v => setCookie(COOKIE.public, String(v), 365))
  watch(showPersonalMarks, v => setCookie(COOKIE.personal, String(v), 365))

  return {
    showPublicMarks,
    showPersonalMarks,
  }
}
