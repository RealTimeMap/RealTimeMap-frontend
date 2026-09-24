import type { Map, MapMouseEvent } from 'maplibre-gl'

const DOUBLE_TAP_DELAY = 300
const DOUBLE_TAP_TOLERANCE = 30

export function onDoubleTap(
  map: Map,
  handler: (event: MapMouseEvent) => void,
): () => void {
  let lastTime = 0
  let lastX = 0
  let lastY = 0

  const onClick = (event: MapMouseEvent) => {
    const now = Date.now()
    const { x, y } = event.point

    const isDouble
      = now - lastTime < DOUBLE_TAP_DELAY
        && Math.hypot(x - lastX, y - lastY) < DOUBLE_TAP_TOLERANCE

    if (isDouble) {
      lastTime = 0
      handler(event)
      return
    }

    lastTime = now
    lastX = x
    lastY = y
  }

  map.on('click', onClick)

  return () => map.off('click', onClick)
}
