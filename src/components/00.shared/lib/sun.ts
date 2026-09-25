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

// --- Луна ---

export interface MoonPosition extends SunPosition {
  /** Освещённая доля диска, 0..1. */
  fraction: number
  /** Фаза: 0 — новолуние, 0.25 — первая четверть, 0.5 — полнолуние, 0.75 — последняя четверть. */
  phase: number
}

const SUN_DISTANCE_KM = 149_598_000

function sunCoords(days: number) {
  const meanAnomaly = RAD * (357.5291 + 0.98560028 * days)
  const center = RAD * (1.9148 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly) + 0.0003 * Math.sin(3 * meanAnomaly))
  const eclipticLng = meanAnomaly + center + RAD * 102.9372 + Math.PI
  return {
    dec: Math.asin(Math.sin(OBLIQUITY) * Math.sin(eclipticLng)),
    ra: Math.atan2(Math.sin(eclipticLng) * Math.cos(OBLIQUITY), Math.cos(eclipticLng)),
  }
}

function moonCoords(days: number) {
  const meanLng = RAD * (218.316 + 13.176396 * days)
  const meanAnomaly = RAD * (134.963 + 13.064993 * days)
  const meanDistance = RAD * (93.272 + 13.22935 * days)
  const lng = meanLng + RAD * 6.289 * Math.sin(meanAnomaly)
  const lat = RAD * 5.128 * Math.sin(meanDistance)
  return {
    ra: Math.atan2(Math.sin(lng) * Math.cos(OBLIQUITY) - Math.tan(lat) * Math.sin(OBLIQUITY), Math.cos(lng)),
    dec: Math.asin(Math.sin(lat) * Math.cos(OBLIQUITY) + Math.cos(lat) * Math.sin(OBLIQUITY) * Math.sin(lng)),
    distance: 385_001 - 20_905 * Math.cos(meanAnomaly),
  }
}

/** Положение и фаза луны по тем же упрощённым формулам (suncalc), что и солнце. */
export function moonPosition(date: Date, lng: number, lat: number): MoonPosition {
  const days = date.getTime() / DAY_MS - J2000_OFFSET
  const moon = moonCoords(days)
  const phi = RAD * lat
  const hourAngle = RAD * (280.16 + 360.9856235 * days) + RAD * lng - moon.ra
  const altitude = Math.asin(Math.sin(phi) * Math.sin(moon.dec) + Math.cos(phi) * Math.cos(moon.dec) * Math.cos(hourAngle))
  const fromSouth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi) - Math.tan(moon.dec) * Math.cos(phi))

  const sun = sunCoords(days)
  const elongation = Math.acos(Math.sin(sun.dec) * Math.sin(moon.dec) + Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra))
  const incidence = Math.atan2(SUN_DISTANCE_KM * Math.sin(elongation), moon.distance - SUN_DISTANCE_KM * Math.cos(elongation))
  const angle = Math.atan2(
    Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra),
    Math.sin(sun.dec) * Math.cos(moon.dec) - Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(sun.ra - moon.ra),
  )

  return {
    azimuth: ((fromSouth / RAD + 180) % 360 + 360) % 360,
    altitude: altitude / RAD,
    fraction: (1 + Math.cos(incidence)) / 2,
    phase: 0.5 + 0.5 * incidence * (angle < 0 ? -1 : 1) / Math.PI,
  }
}
