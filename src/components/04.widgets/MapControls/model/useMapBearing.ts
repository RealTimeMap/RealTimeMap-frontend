import type { Map } from 'maplibre-gl'

/** Поворот и наклон карты для кнопки «на север». */
export function useMapBearing(map: () => Map | null) {
  const bearing = ref(0)
  const pitch = ref(0)

  function sync() {
    const instance = map()
    if (!instance)
      return
    bearing.value = instance.getBearing()
    pitch.value = instance.getPitch()
  }

  watch(map, (instance, previous) => {
    previous?.off('rotate', sync)
    previous?.off('pitch', sync)
    instance?.on('rotate', sync)
    instance?.on('pitch', sync)
    sync()
  }, { immediate: true })

  onUnmounted(() => {
    map()?.off('rotate', sync)
    map()?.off('pitch', sync)
  })

  const isRotated = computed(() => Math.abs(bearing.value) > 0.5 || pitch.value > 0.5)

  function resetNorth() {
    map()?.resetNorthPitch({ duration: 400 })
  }

  return { bearing, isRotated, resetNorth }
}
