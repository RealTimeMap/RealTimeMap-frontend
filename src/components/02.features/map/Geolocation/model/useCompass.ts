/** Доля нового значения при сглаживании: датчик шумит, и без фильтра конус дрожит. */
const SMOOTHING = 0.2

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number }
type PermissionRequest = () => Promise<'granted' | 'denied'>

/**
 * Направление телефона в градусах от севера. Одно на всё приложение: включает режим следования,
 * а рисует конус карта. Значение не сводится к 0..360 — при переходе через север конус не делает оборот.
 */
const heading = ref<number | null>(null)
let listening = false

function screenAngle(): number {
  return screen.orientation?.angle ?? 0
}

function readHeading(event: OrientationEvent): number | null {
  // iOS отдаёт готовый компасный курс, Android — абсолютный alpha против часовой стрелки
  if (typeof event.webkitCompassHeading === 'number')
    return event.webkitCompassHeading + screenAngle()
  if (event.absolute && event.alpha !== null)
    return 360 - event.alpha + screenAngle()
  return null
}

function onOrientation(event: Event) {
  const raw = readHeading(event as OrientationEvent)
  if (raw === null)
    return
  if (heading.value === null) {
    heading.value = raw
    return
  }
  // Кратчайший поворот: из 359° в 1° — это +2°, а не −358°
  const delta = ((raw - heading.value) % 360 + 540) % 360 - 180
  heading.value += delta * SMOOTHING
}

/** Абсолютное событие есть в Chrome на Android; в Safari курс приходит в обычном deviceorientation. */
const EVENT_NAME = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation'

/** На iOS разрешение спрашивается только в обработчике нажатия — вызывать start прямо из click. */
async function start() {
  if (listening || typeof DeviceOrientationEvent === 'undefined')
    return
  listening = true
  const request = (DeviceOrientationEvent as unknown as { requestPermission?: PermissionRequest }).requestPermission
  if (request) {
    try {
      if (await request() !== 'granted') {
        listening = false
        return
      }
    }
    catch {
      listening = false
      return
    }
  }
  if (listening)
    window.addEventListener(EVENT_NAME, onOrientation)
}

function stop() {
  listening = false
  window.removeEventListener(EVENT_NAME, onOrientation)
  heading.value = null
}

export function useCompass() {
  return { heading: readonly(heading), start, stop }
}
