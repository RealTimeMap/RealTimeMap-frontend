/** Звёздное небо за шаром: рисуется один раз и кладётся фоном — анимации и перерисовки нет. */
const SIZE = 512
const STARS = 170

let cached: string | null = null

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

export function starfield(): string {
  if (cached)
    return cached
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const random = seeded(3)
  for (let i = 0; i < STARS; i++) {
    const bright = random() < 0.08
    const radius = bright ? 1 + random() * 0.8 : 0.4 + random() * 0.6
    ctx.globalAlpha = bright ? 0.9 : 0.25 + random() * 0.5
    ctx.fillStyle = random() < 0.15 ? '#cfd8ff' : '#ffffff'
    ctx.beginPath()
    ctx.arc(random() * SIZE, random() * SIZE, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  cached = canvas.toDataURL('image/png')
  return cached
}
