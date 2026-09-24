export type Rgb = [number, number, number]

let probe: CanvasRenderingContext2D | null = null

/**
 * Любой CSS-цвет (в том числе oklch из переменных темы) → RGB.
 * MapLibre не понимает oklch, поэтому цвет прогоняется через пиксель canvas.
 */
export function resolveCssColor(value: string, fallback: Rgb = [124, 58, 237]): Rgb {
  if (!probe)
    probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!probe || !value.trim())
    return fallback
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = '#000'
  probe.fillStyle = value.trim()
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
  return [r!, g!, b!]
}

/** Значение CSS-переменной темы как RGB. */
export function readThemeColor(name: string, fallback?: Rgb): Rgb {
  return resolveCssColor(getComputedStyle(document.documentElement).getPropertyValue(name), fallback)
}

export function rgba([r, g, b]: Rgb, alpha = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function mixRgb(a: Rgb, b: Rgb, amount: number): Rgb {
  return [0, 1, 2].map(i => Math.round(a[i]! + (b[i]! - a[i]!) * amount)) as Rgb
}

/** Колбэк после применения новой темы: CSS-переменные к этому моменту уже обновлены. */
export function onThemeApplied(callback: () => void): () => void {
  const observer = new MutationObserver(() => callback())
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
