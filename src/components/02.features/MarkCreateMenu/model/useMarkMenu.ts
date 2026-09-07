import type { MapPoint } from '@/types/shared/map'

export interface MarkMenuProps {
  x: number
  y: number
  coords: MapPoint
}

export const MENU_MARGIN = 12
export const MENU_TOP_RESERVE = 90
export const MENU_BOTTOM_RESERVE = 110

export interface MarkMenuOptions {
  /** Горизонтальный отступ безопасной зоны (px) */
  side?: number
  /** Верхний отступ безопасной зоны (px) */
  top?: number
  /** Нижний отступ безопасной зоны (px) */
  bottom?: number
  /**
   * Подтянуть начальную позицию в безопасную зону при монтировании
   * (для симметричных меню, где важно, чтобы всё влезло на экран).
   */
  clampInitial?: boolean
}

export function useMarkMenu(
  props: MarkMenuProps,
  onMove: (x: number, y: number) => void,
  options: MarkMenuOptions = {},
) {
  const side = options.side ?? MENU_MARGIN
  const top = options.top ?? MENU_TOP_RESERVE
  const bottom = options.bottom ?? MENU_BOTTOM_RESERVE

  const pos = reactive({ x: props.x, y: props.y })

  function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(min, v), Math.max(min, max))
  }

  const coordsLabel = computed(() => {
    const [lng, lat] = props.coords
    const ns = lat >= 0 ? 'N' : 'S'
    const ew = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
  })

  let dragging = false
  let lastX = 0
  let lastY = 0

  function onDragStart(e: PointerEvent) {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
  }

  function onDragMove(e: PointerEvent) {
    if (!dragging)
      return
    pos.x = clamp(pos.x + (e.clientX - lastX), side, window.innerWidth - side)
    pos.y = clamp(pos.y + (e.clientY - lastY), top, window.innerHeight - bottom)
    lastX = e.clientX
    lastY = e.clientY
    onMove(pos.x, pos.y)
  }

  function onDragEnd() {
    dragging = false
  }

  if (options.clampInitial) {
    onMounted(() => {
      const cx = clamp(pos.x, side, window.innerWidth - side)
      const cy = clamp(pos.y, top, window.innerHeight - bottom)
      if (cx !== pos.x || cy !== pos.y) {
        pos.x = cx
        pos.y = cy
        onMove(cx, cy)
      }
    })
  }

  return {
    pos,
    clamp,
    coordsLabel,
    onDragStart,
    onDragMove,
    onDragEnd,
  }
}
