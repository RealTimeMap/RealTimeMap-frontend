import type { Map } from 'maplibre-gl'
import type { MapPoint } from '@/types/shared/map'

const FOLLOW_ZOOM = 16

/**
 * Режим следования: карта держит позицию пользователя в центре,
 * пока он сам не сдвинет карту.
 */
export function useFollowUser(map: () => Map | null, position: () => MapPoint | null) {
  const following = ref(false)
  let pageActive = true

  function stop() {
    following.value = false
  }

  function flyToUser() {
    const instance = map()
    const pos = position()
    if (instance && pos)
      instance.flyTo({ center: pos, zoom: Math.max(instance.getZoom(), FOLLOW_ZOOM), essential: true })
  }

  function start() {
    following.value = true
    flyToUser()
  }

  function toggle() {
    if (following.value)
      stop()
    else
      start()
  }

  watch(position, (pos) => {
    const instance = map()
    // Во время flyTo/easeTo не перебиваем анимацию — догоним на следующем обновлении
    if (!following.value || !pageActive || !instance || !pos || instance.isMoving())
      return
    instance.easeTo({ center: pos, duration: 800, essential: true })
  })

  // dragstart приходит только от жеста пользователя, не от наших easeTo
  watch(map, (instance, previous) => {
    previous?.off('dragstart', stop)
    instance?.on('dragstart', stop)
    // Нажали до загрузки карты — летим, как только она появилась
    if (instance && !previous && following.value)
      flyToUser()
  }, { immediate: true })

  onActivated(() => {
    pageActive = true
    const instance = map()
    const pos = position()
    if (following.value && instance && pos)
      instance.jumpTo({ center: pos })
  })

  onDeactivated(() => {
    pageActive = false
  })

  onUnmounted(() => {
    map()?.off('dragstart', stop)
  })

  return { following, toggle }
}
