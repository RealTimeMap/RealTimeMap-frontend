const RAD = Math.PI / 180
const DAY_MS = 86_400_000
/** Дней от 1970-01-01 до эпохи J2000 (полдень 2000-01-01). */
const J2000_OFFSET = 10957.5
const OBLIQUITY = 23.4397 * RAD

export interface SunPosition {
  /** Азимут в градусах от севера по часовой стрелке. */
  azimuth: number
  /** Высота над горизонтом в градусах, отрицательная — солнце за горизонтом. */
  altitude: number
}

/** Положение солнца по упрощённым формулам (как в suncalc) — точности в пределах градуса хватает для освещения. */
export function sunPosition(date: Date, lng: number, lat: number): SunPosition {
  const days = date.getTime() / DAY_MS - J2000_OFFSET
  const meanAnomaly = RAD * (357.5291 + 0.98560028 * days)
  const center = RAD * (1.9148 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly) + 0.0003 * Math.sin(3 * meanAnomaly))
  const eclipticLng = meanAnomaly + center + RAD * 102.9372 + Math.PI

  const declination = Math.asin(Math.sin(OBLIQUITY) * Math.sin(eclipticLng))
  const rightAscension = Math.atan2(Math.sin(eclipticLng) * Math.cos(OBLIQUITY), Math.cos(eclipticLng))
  const hourAngle = RAD * (280.16 + 360.9856235 * days) + RAD * lng - rightAscension
  const phi = RAD * lat

  const altitude = Math.asin(Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle))
  // Формула даёт азимут от юга к западу — переводим в привычный «от севера по часовой»
  const fromSouth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi))

  return {
    azimuth: ((fromSouth / RAD + 180) % 360 + 360) % 360,
    altitude: altitude / RAD,
  }
}
