<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { useWeatherStore } from '@/components/02.features/map/Weather'
import { createPrecipitation } from '../model/precipitation'
import { roadPart, weatherRoadColor } from '../model/roads'

// Карта под погоду: мокрый асфальт в дождь, присыпанные дороги в снег,
// молочная пелена в тумане, тяжёлое небо в грозу. Всё меняется только при смене погоды — в кадре ничего не считается

/** Имя стиля CARTO → тема. Тему берём из загруженного стиля: при смене темы стиль приходит позже настроек. */
const STYLE_BASE: Record<string, ThemeBase> = { 'Positron': 'light', 'Dark Matter': 'dark' }

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const weatherStore = useWeatherStore()
/** Молнии — только в грозу: тяжесть неба у неё около 0,9, у ливня заметно меньше. */
const STORM_GLOOM = 0.85
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

// --- Круги от капель и молнии ---
const precipitation = createPrecipitation()

// --- Пелена тумана и тяжёлое небо: слои между картой и метками ---
// Туман гуще к горизонту; цвет постоянный, сила — прозрачностью слоя, её браузер плавно меняет сам
const FOG: Record<ThemeBase, { color: string, alpha: [top: number, middle: number, bottom: number] }> = {
  light: { color: '232, 235, 239', alpha: [0.88, 0.55, 0.42] },
  dark: { color: '138, 148, 163', alpha: [0.62, 0.36, 0.28] },
}
const GLOOM: Record<ThemeBase, number> = { light: 0.34, dark: 0.4 }

const fogVeil = document.createElement('div')
fogVeil.className = 'map-weather-veil'
const gloomVeil = document.createElement('div')
gloomVeil.className = 'map-weather-veil'

function updateVeils(base: ThemeBase) {
  const { fog, gloom } = weatherStore.look
  const { color, alpha: [top, middle, bottom] } = FOG[base]
  fogVeil.style.background = `linear-gradient(to bottom, rgba(${color}, ${top}) 0%, rgba(${color}, ${middle}) 55%, rgba(${color}, ${bottom}) 100%)`
  fogVeil.style.opacity = String(fog)
  // Холодный сине-серый: тяжёлое небо, а не просто затемнение
  gloomVeil.style.background = `rgba(22, 34, 54, ${GLOOM[base]})`
  gloomVeil.style.opacity = String(gloom)
}

// --- Дороги ---
/** Исходные цвета дорог каждого стиля — от них считаем погодные и к ним возвращаемся. */
const originals = new Map<string, Map<string, unknown>>()

function captureOriginals(instance: maplibregl.Map, styleName: string): Map<string, unknown> {
  let values = originals.get(styleName)
  if (values)
    return values
  values = new Map()
  for (const layer of instance.getStyle().layers) {
    if (layer.type === 'line' && roadPart(layer.id))
      values.set(layer.id, instance.getPaintProperty(layer.id, 'line-color'))
  }
  originals.set(styleName, values)
  return values
}

function snowAmount(): number {
  return Math.max(weatherStore.look.snowfall, weatherStore.look.snowCover)
}

function setIfChanged(instance: maplibregl.Map, layer: string, value: unknown) {
  // setPaintProperty вызывает styledata — без сравнения получился бы цикл
  if (JSON.stringify(instance.getPaintProperty(layer, 'line-color')) === JSON.stringify(value))
    return
  instance.setPaintProperty(layer, 'line-color', value as string)
}

function apply() {
  const instance = map?.value
  if (!instance?.getLayer('background'))
    return
  const styleName = instance.getStyle().name ?? ''
  const base = STYLE_BASE[styleName]
  if (!base)
    return
  const { wet } = weatherStore.look
  const snow = snowAmount()
  for (const [id, original] of captureOriginals(instance, styleName)) {
    if (instance.getLayer(id))
      setIfChanged(instance, id, weatherRoadColor(original, roadPart(id)!, base, wet, snow))
  }
  updateVeils(base)
  precipitation.update(weatherStore.look, base, weatherStore.look.gloom >= STORM_GLOOM, !reducedMotion.matches)
}

// styledata приходит пачками — сводим к одному пересчёту на кадр
let frame = 0
function scheduleApply() {
  if (frame)
    return
  frame = requestAnimationFrame(() => {
    frame = 0
    apply()
  })
}

watch(() => weatherStore.look, apply)

function onPitch() {
  const instance = map?.value
  if (instance)
    precipitation.setPitch(instance.getPitch())
}

watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', scheduleApply)
  previous?.off('pitch', onPitch)
  if (!instance)
    return
  instance.getCanvas().after(fogVeil, gloomVeil, ...precipitation.elements)
  instance.on('styledata', scheduleApply)
  instance.on('pitch', onPitch)
  onPitch()
  scheduleApply()
}, { immediate: true })

onUnmounted(() => {
  cancelAnimationFrame(frame)
  fogVeil.remove()
  gloomVeil.remove()
  precipitation.dispose()
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', scheduleApply)
  instance.off('pitch', onPitch)
  const restore = originals.get(instance.getStyle()?.name ?? '')
  for (const [id, original] of restore ?? []) {
    if (instance.getLayer(id))
      setIfChanged(instance, id, original)
  }
})
</script>

<template>
  <slot />
</template>

<style lang="scss">
.map-weather-veil {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 3s ease;
}

// --- Круги от капель: кольцо расходится и гаснет; приплюснуто по наклону камеры, будто лежит на земле ---
.map-weather-ripples {
  --squash: 1;
  --ripple-color: rgb(62 88 120 / 0.8);

  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;

  &[data-theme='dark'] {
    --ripple-color: rgb(190 210 232 / 0.7);
  }
}

.map-weather-ripple {
  position: absolute;
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
  border: 2px solid var(--ripple-color);
  border-radius: 50%;
  opacity: 0;
  animation: map-ripple 1.4s ease-out infinite;

  &[hidden] {
    display: none;
  }
}

// Молния: две вспышки подряд, как настоящая
.map-weather-flash {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  background: rgb(235 240 255 / 0.55);

  &--on {
    animation: map-flash 900ms linear;
  }
}

@keyframes map-ripple {
  0% {
    opacity: 0.9;
    transform: scaleY(var(--squash)) scale(0.1);
  }
  100% {
    opacity: 0;
    transform: scaleY(var(--squash)) scale(1);
  }
}

@keyframes map-flash {
  0%,
  40%,
  100% {
    opacity: 0;
  }
  6% {
    opacity: 1;
  }
  14% {
    opacity: 0.15;
  }
  22% {
    opacity: 0.85;
  }
}
</style>
