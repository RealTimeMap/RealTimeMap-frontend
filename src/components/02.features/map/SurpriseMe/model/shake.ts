// --- Встряхивание телефона ---
// Несколько сильных рывков подряд за секунду. Одно резкое движение (положил телефон на стол) не считается

/** Сила рывка без учёта тяжести, м/с². */
const THRESHOLD = 13
const PEAKS = 3
const WINDOW_MS = 1000
/** Ближе друг к другу — это один и тот же рывок, датчик шлёт события часто. */
const PEAK_GAP_MS = 120
const COOLDOWN_MS = 3000
const GRAVITY = 9.81

type PermissionRequest = () => Promise<'granted' | 'denied'>

function strength(event: DeviceMotionEvent): number | null {
  const pure = event.acceleration
  if (pure?.x != null)
    return Math.hypot(pure.x, pure.y ?? 0, pure.z ?? 0)
  const withGravity = event.accelerationIncludingGravity
  if (withGravity?.x != null)
    return Math.abs(Math.hypot(withGravity.x, withGravity.y ?? 0, withGravity.z ?? 0) - GRAVITY)
  return null
}

/**
 * Слушать встряхивание. На iOS события пойдут только после разрешения —
 * его выдаёт allowShake из нажатия (или уже выданное компасу: разрешение у них общее).
 * У каждой подписки своё состояние: повторный монтаж компонента не снимает чужой обработчик.
 */
export function listenShake(onShake: () => void): () => void {
  let peaks: number[] = []
  let lastShake = -Infinity

  function onMotion(event: DeviceMotionEvent) {
    const value = strength(event)
    if (value === null || value < THRESHOLD)
      return
    const now = performance.now()
    if (now - lastShake < COOLDOWN_MS)
      return
    peaks = peaks.filter(time => now - time < WINDOW_MS)
    if (peaks.length && now - peaks[peaks.length - 1]! < PEAK_GAP_MS)
      return
    peaks.push(now)
    if (peaks.length < PEAKS)
      return
    peaks = []
    lastShake = now
    onShake()
  }

  window.addEventListener('devicemotion', onMotion)
  return () => window.removeEventListener('devicemotion', onMotion)
}

/** На iOS спрашивает доступ к датчику движения — вызывать прямо из обработчика нажатия. */
export async function allowShake(): Promise<boolean> {
  if (typeof DeviceMotionEvent === 'undefined')
    return false
  const request = (DeviceMotionEvent as unknown as { requestPermission?: PermissionRequest }).requestPermission
  if (!request)
    return true
  try {
    return await request() === 'granted'
  }
  catch {
    return false
  }
}
