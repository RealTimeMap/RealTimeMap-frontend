/**
 * Сторона плитки узора в пикселях (при pixelRatio 2 — 192 пикселя экрана). Плитка крупная, а бликов
 * на ней мало и стоят вразброс — иначе узор повторяется заметной сеткой и выглядит колонками.
 */
export const TILE = 384
export const PIXEL_RATIO = 2
/**
 * Блики плывут прямо вдоль своей линии: половина в одну сторону, половина в другую.
 * За период каждый проходит целое число плиток — движение зациклено без скачка.
 */
const LOOP_SECONDS = 24

interface Glint {
  x: number
  y: number
  length: number
  alpha: number
  /** Фаза и частота мерцания — блик плавно проявляется и гаснет на ходу. */
  phase: number
  speed: number
  /** Направление движения: +1 или −1 по горизонтали. */
  direction: number
  /** Сколько плиток блик проходит за период — у всех разная скорость. */
  laps: number
  tilt: number
}

/** Псевдослучайные числа с фиксированным зерном — узор одинаковый при каждом открытии. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

const random = seeded(7)
const GLINTS: Glint[] = Array.from({ length: 9 }, () => ({
  x: random() * TILE,
  y: random() * TILE,
  length: 10 + random() * 18,
  alpha: 0.35 + random() * 0.5,
  phase: random() * Math.PI * 2,
  speed: 0.3 + random() * 0.4,
  direction: random() < 0.5 ? -1 : 1,
  laps: 1 + Math.floor(random() * 2),
  tilt: (random() - 0.5) * 0.3,
}))

function context(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE
  return canvas.getContext('2d', { willReadFrequently: true })!
}

const ctx = context()

/** Штрих с переносом через края плитки — узор бесшовный. */
function stroke(x: number, y: number, length: number, tilt: number) {
  const dx = Math.cos(tilt) * length
  const dy = Math.sin(tilt) * length
  for (const ox of [-TILE, 0, TILE]) {
    for (const oy of [-TILE, 0, TILE]) {
      ctx.beginPath()
      ctx.moveTo(x + ox, y + oy)
      ctx.lineTo(x + ox + dx, y + oy + dy)
      ctx.stroke()
    }
  }
}

/** Блики на воде в момент time (секунды): плывут прямо и мягко мерцают. */
export function drawGlints(time: number): Uint8Array {
  ctx.clearRect(0, 0, TILE, TILE)
  ctx.lineCap = 'round'
  ctx.lineWidth = 3
  for (const glint of GLINTS) {
    const twinkle = 0.6 + 0.4 * Math.sin(time * glint.speed + glint.phase)
    ctx.strokeStyle = `rgba(255, 255, 255, ${(glint.alpha * twinkle).toFixed(3)})`
    const travel = ((time % LOOP_SECONDS) / LOOP_SECONDS) * glint.laps * TILE * glint.direction
    const x = (((glint.x + travel * Math.cos(glint.tilt)) % TILE) + TILE) % TILE
    const y = (((glint.y + travel * Math.sin(glint.tilt)) % TILE) + TILE) % TILE
    stroke(x, y, glint.length, glint.tilt)
  }
  return new Uint8Array(ctx.getImageData(0, 0, TILE, TILE).data.buffer)
}

/** Лёд: неподвижные тонкие трещины и светлые пятна — анимации нет, карта не перерисовывается. */
export function drawIce(): Uint8Array {
  const rand = seeded(19)
  ctx.clearRect(0, 0, TILE, TILE)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 1.2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  for (let i = 0; i < 6; i++) {
    let x = rand() * TILE
    let y = rand() * TILE
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let j = 0; j < 4; j++) {
      x += (rand() - 0.5) * 70
      y += (rand() - 0.5) * 70
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.ellipse(rand() * TILE, rand() * TILE, 14 + rand() * 24, 6 + rand() * 10, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  return new Uint8Array(ctx.getImageData(0, 0, TILE, TILE).data.buffer)
}
