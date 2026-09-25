function parseHex(hex: string): number[] {
  return [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16))
}

/** Смесь двух цветов #rrggbb: t = 0 — первый, t = 1 — второй. */
export function mixHex(a: string, b: string, t: number): string {
  const [ca, cb] = [parseHex(a), parseHex(b)]
  return `#${ca.map((c, i) => Math.round(c + (cb[i]! - c) * t).toString(16).padStart(2, '0')).join('')}`
}
