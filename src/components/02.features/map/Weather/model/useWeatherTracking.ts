import type { MapPoint } from '@/types/shared/map'
import { useWeatherStore } from './store'

const REFRESH_MS = 15 * 60_000

/**
 * Держит прогноз свежим, пока открыта карта. Отдельно от плашки: погоду читают и небо, и снег,
 * и вода — даже когда сама плашка выключена.
 */
export function useWeatherTracking(position: () => MapPoint | null) {
  const store = useWeatherStore()
  const refresh = () => store.refresh(position())

  watch(position, point => store.refresh(point), { immediate: true })
  const timer = setInterval(refresh, REFRESH_MS)

  function onVisibility() {
    if (document.visibilityState === 'visible')
      refresh()
  }
  document.addEventListener('visibilitychange', onVisibility)
  onActivated(refresh)

  onUnmounted(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  })
}
