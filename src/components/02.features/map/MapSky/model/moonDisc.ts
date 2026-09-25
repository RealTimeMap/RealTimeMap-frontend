/** Диск луны с настоящей фазой: освещённая часть, терминатор — полуэллипс. Рисуется, только когда фаза заметно сменилась. */
export function drawMoon(canvas: HTMLCanvasElement, phase: number, southern: boolean) {
  const size = canvas.width
  const ctx = canvas.getContext('2d')!
  const r = size * 0.42
  const c = size / 2
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  // В южном полушарии луна видна зеркально
  if (southern) {
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
  }

  // Неосвещённая часть — едва заметный пепельный диск
  ctx.fillStyle = 'rgba(190, 200, 220, 0.12)'
  ctx.beginPath()
  ctx.arc(c, c, r, 0, Math.PI * 2)
  ctx.fill()

  const waxing = phase < 0.5
  const local = waxing ? phase : phase - 0.5
  // Серп — меньше половины диска, терминатор выгибается к светлой стороне
  const crescent = waxing ? local < 0.25 : local > 0.25
  const terminator = Math.abs(Math.cos(2 * Math.PI * phase)) * r

  ctx.fillStyle = '#f4f1e6'
  ctx.shadowColor = 'rgba(244, 241, 230, 0.55)'
  ctx.shadowBlur = size * 0.18
  ctx.beginPath()
  // Растущая луна освещена справа, убывающая — слева
  ctx.arc(c, c, r, -Math.PI / 2, Math.PI / 2, !waxing)
  const throughRight = waxing ? crescent : !crescent
  ctx.ellipse(c, c, terminator, r, 0, Math.PI / 2, -Math.PI / 2, throughRight)
  ctx.fill()
  ctx.restore()
}
