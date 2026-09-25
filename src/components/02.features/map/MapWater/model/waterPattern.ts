/** Узоры рисуются в двойном разрешении — на экране вдвое меньше. */
export const PIXEL_RATIO = 2

/** Плитка стоячей воды (озёра, пруды): 192 пикселя экрана, редкие блики вразброс. */
export const STILL_TILE = 384

/**
 * Полоса течения: натягивается на линию русла, высота полосы — ширина линии.
 * Блики стоят на нескольких «дорожках» поперёк реки и плывут вдоль полосы, то есть по течению.
 */
export const FLOW_WIDTH = 512
export const FLOW_HEIGHT = 64
/** За период каждый блик проходит целое число полос — движение зациклено без скачка. */
const FLOW_LOOP_SECONDS = 20

/** Псевдослучайные числа с фиксированным зерном — узор одинаковый при каждом открытии. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

function canvas(width: number, height: number): CanvasRenderingContext2D {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  return element.getContext('2d', { willReadFrequently: true })!
}

const flowCtx = canvas(FLOW_WIDTH, FLOW_HEIGHT)
const stillCtx = canvas(STILL_TILE, STILL_TILE)

function pixels(ctx: CanvasRenderingContext2D, width: number, height: number) {
  return { width, height, data: new Uint8Array(ctx.getImageData(0, 0, width, height).data.buffer) }
}

// --- Течение ---

interface FlowGlint {
  x: number
  /** Дорожка поперёк реки: у берегов блики бледнее. */
  y: number
  length: number
  alpha: number
  /** Сколько полос проходит за период: у середины реки течение быстрее. */
  laps: number
  phase: number
}

const flowRandom = seeded(11)
const FLOW_GLINTS: FlowGlint[] = Array.from({ length: 10 }, () => {
  const y = 8 + flowRandom() * (FLOW_HEIGHT - 16)
  const center = 1 - Math.abs(y / FLOW_HEIGHT - 0.5) * 2
  return {
    x: flowRandom() * FLOW_WIDTH,
    y,
    length: 24 + flowRandom() * 34,
    alpha: 0.5 + center * 0.5,
    laps: center > 0.5 ? 2 : 1,
    phase: flowRandom() * Math.PI * 2,
  }
})

/** Мягкий блик: яркая середина, концы растворяются — без резких обрезов, как у тире. */
function softStroke(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, alpha: number, tilt = 0) {
  const x2 = x + Math.cos(tilt) * length
  const y2 = y + Math.sin(tilt) * length
  const gradient = ctx.createLinearGradient(x, y, x2, y2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha.toFixed(3)})`)
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.strokeStyle = gradient
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

/** Блики течения в момент time (секунды): плывут вдоль русла, чуть мерцая. */
export function drawFlow(time: number) {
  const ctx = flowCtx
  ctx.clearRect(0, 0, FLOW_WIDTH, FLOW_HEIGHT)
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
  const progress = (time % FLOW_LOOP_SECONDS) / FLOW_LOOP_SECONDS
  for (const glint of FLOW_GLINTS) {
    const twinkle = 0.75 + 0.25 * Math.sin(time * 0.6 + glint.phase)
    const x = (glint.x + progress * glint.laps * FLOW_WIDTH) % FLOW_WIDTH
    // Перенос через край полосы — узор бесшовный вдоль линии
    for (const offset of [0, -FLOW_WIDTH])
      softStroke(ctx, x + offset, glint.y, glint.length, glint.alpha * twinkle)
  }
  return pixels(ctx, FLOW_WIDTH, FLOW_HEIGHT)
}

// --- Стоячая вода ---

/** Озёра и пруды: редкие неподвижные блики под разными наклонами. */
export function drawStill() {
  const ctx = stillCtx
  const random = seeded(7)
  ctx.clearRect(0, 0, STILL_TILE, STILL_TILE)
  ctx.lineCap = 'round'
  ctx.lineWidth = 3.5
  for (let i = 0; i < 8; i++) {
    const x = random() * STILL_TILE
    const y = random() * STILL_TILE
    const length = 20 + random() * 26
    const tilt = (random() - 0.5) * 0.3
    const alpha = 0.35 + random() * 0.4
    for (const ox of [-STILL_TILE, 0, STILL_TILE]) {
      for (const oy of [-STILL_TILE, 0, STILL_TILE])
        softStroke(ctx, x + ox, y + oy, length, alpha, tilt)
    }
  }
  return pixels(ctx, STILL_TILE, STILL_TILE)
}

/** Лёд: неподвижные тонкие трещины и светлые пятна. */
export function drawIce() {
  const ctx = stillCtx
  const random = seeded(19)
  ctx.clearRect(0, 0, STILL_TILE, STILL_TILE)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 1.2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  for (let i = 0; i < 6; i++) {
    let x = random() * STILL_TILE
    let y = random() * STILL_TILE
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let j = 0; j < 4; j++) {
      x += (random() - 0.5) * 70
      y += (random() - 0.5) * 70
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.ellipse(random() * STILL_TILE, random() * STILL_TILE, 14 + random() * 24, 6 + random() * 10, random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  return pixels(ctx, STILL_TILE, STILL_TILE)
}
