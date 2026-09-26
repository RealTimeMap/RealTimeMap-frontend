import type { ThemeBase } from '@/components/00.shared/lib/theme'
import type { WeatherLook } from '@/components/02.features/map/Weather'

// --- Круги от капель и молнии ---
// В дождь по асфальту редко расходятся маленькие круги, как от капель в лужах; в грозу вспыхивают молнии.
// Слои между картой и метками: интерфейс и метки остаются чистыми. Колец немного, двигаются только
// transform и opacity; каждое после круга перескакивает в новое место. Без дождя колец нет совсем

/** Сколько колец в ливень; в морось — треть. */
const RING_MAX = 18
const RING_MIN = 6
/** Молния — раз в 7–18 секунд, двойной вспышкой. */
const FLASH_MIN_MS = 7000
const FLASH_SPREAD_MS = 11_000
/** Кольцо живёт столько — с разбросом, чтобы капли не падали в такт. */
const RING_CYCLE_S = 1.4

export interface Precipitation {
  elements: HTMLElement[]
  update: (look: WeatherLook, base: ThemeBase, storm: boolean, enabled: boolean) => void
  /** Наклон камеры: при взгляде сбоку круги на земле приплюснуты. */
  setPitch: (pitch: number) => void
  dispose: () => void
}

function place(ring: HTMLElement) {
  ring.style.left = `${Math.random() * 100}%`
  // Сверху при наклоне — горизонт и небо, там капли на земле не видны
  ring.style.top = `${20 + Math.random() * 78}%`
  ring.style.setProperty('--size', `${20 + Math.random() * 22}px`)
}

export function createPrecipitation(): Precipitation {
  const ripples = document.createElement('div')
  ripples.className = 'map-weather-ripples'
  const rings = Array.from({ length: RING_MAX }, () => {
    const ring = document.createElement('span')
    ring.className = 'map-weather-ripple'
    ring.hidden = true
    ring.style.animationDuration = `${RING_CYCLE_S * (0.8 + Math.random() * 0.4)}s`
    ring.addEventListener('animationiteration', () => place(ring))
    ripples.append(ring)
    return ring
  })

  const flash = document.createElement('div')
  flash.className = 'map-weather-flash'

  let flashTimer: ReturnType<typeof setTimeout> | undefined
  let stormy = false

  function scheduleFlash() {
    clearTimeout(flashTimer)
    if (!stormy)
      return
    flashTimer = setTimeout(() => {
      flash.classList.remove('map-weather-flash--on')
      // Перерасчёт стилей перезапускает анимацию вспышки
      void flash.offsetWidth
      flash.classList.add('map-weather-flash--on')
      scheduleFlash()
    }, FLASH_MIN_MS + Math.random() * FLASH_SPREAD_MS)
  }

  function update(look: WeatherLook, base: ThemeBase, storm: boolean, enabled: boolean) {
    ripples.dataset.theme = base
    const nextRaining = enabled && look.wet > 0
    const count = Math.round(RING_MIN + (RING_MAX - RING_MIN) * look.wet)
    rings.forEach((ring, index) => {
      const visible = nextRaining && index < count
      // Только что показанное кольцо — сразу в случайное место и в случайной фазе
      if (visible && ring.hidden) {
        place(ring)
        ring.style.animationDelay = `${-Math.random() * RING_CYCLE_S}s`
      }
      ring.hidden = !visible
    })

    const nextStormy = enabled && storm
    if (nextStormy !== stormy) {
      stormy = nextStormy
      scheduleFlash()
    }
  }

  function setPitch(pitch: number) {
    ripples.style.setProperty('--squash', Math.cos(pitch * Math.PI / 180).toFixed(2))
  }

  function dispose() {
    stormy = false
    clearTimeout(flashTimer)
    ripples.remove()
    flash.remove()
  }

  return { elements: [ripples, flash], update, setPitch, dispose }
}
