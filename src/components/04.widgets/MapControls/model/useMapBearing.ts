import type { Map } from 'maplibre-gl'

/** Наклон вида «со стороны»: здания видны объёмом, но горизонт ещё не лезет в кадр. */
const TILTED_PITCH = 60

/** Поворот и наклон карты для кнопок «на север» и «2D / 3D». */
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

  const isRotated = computed(() => Math.abs(bearing.value) > 0.5)

  function resetNorth() {
    map()?.resetNorth({ duration: 400 })
  }

  const isTilted = computed(() => pitch.value > 10)

  function togglePitch() {
    map()?.easeTo({ pitch: isTilted.value ? 0 : TILTED_PITCH, duration: 600, essential: true })
  }

  return { bearing, isRotated, isTilted, resetNorth, togglePitch }
}
