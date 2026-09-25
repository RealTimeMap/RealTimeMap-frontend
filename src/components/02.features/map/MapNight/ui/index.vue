<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { mapNow } from '@/components/00.shared/lib/mapClock'
import { useMapStyleBase } from '@/components/00.shared/lib/mapStyleBase'
import { sunPosition } from '@/components/00.shared/lib/sun'
import {
  createLightsLayer,
  darknessAt,
  LIGHTS_LAYER_ID,
  lightsOpacity,
} from '../model/nightLayers'

/** Сумерки идут минут сорок — раз в минуту хватает, чтобы темнело плавно. */
const UPDATE_MS = 60_000

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const styleBase = useMapStyleBase()

function darkness(instance: maplibregl.Map): number {
  const { lng, lat } = instance.getCenter()
  return darknessAt(sunPosition(mapNow(), lng, lat).altitude)
}

const OWN = new Set([LIGHTS_LAYER_ID])

/**
 * Куда класть ночь: сразу над последним слоем с геометрией (дороги, дома, деревья), под подписями.
 * «Перед первой подписью» не подходит — в Positron часть подписей идёт раньше дорог, и дороги
 * с домами оставались бы белыми поверх сумрака.
 */
function nightBeforeId(instance: maplibregl.Map): string | undefined {
  const layers = instance.getStyle().layers
  let last = -1
  layers.forEach((layer, index) => {
    if (!OWN.has(layer.id) && layer.type !== 'symbol')
      last = index
  })
  return layers.slice(last + 1).find(layer => !OWN.has(layer.id))?.id
}

/** Дома и деревья добавляются позже ночных слоёв — тогда ночь поднимаем обратно наверх. */
function keepOnTop(instance: maplibregl.Map) {
  const ids = instance.getStyle().layers.map(layer => layer.id)
  const before = nightBeforeId(instance)
  const target = before ? ids.indexOf(before) : ids.length
  if (ids[target - 1] === LIGHTS_LAYER_ID)
    return
  instance.moveLayer(LIGHTS_LAYER_ID, before)
}

function ensureLayers(instance: maplibregl.Map) {
  const base = styleBase.value
  const dark = darkness(instance)
  if (!instance.getLayer(LIGHTS_LAYER_ID))
    instance.addLayer(createLightsLayer(base, dark), nightBeforeId(instance))
}

function apply() {
  const instance = map?.value
  if (!instance?.getLayer(LIGHTS_LAYER_ID))
    return
  const base = styleBase.value
  const dark = darkness(instance)
  const visibility = dark > 0 ? 'visible' : 'none'
  // Днём слои выключены совсем — не рисуются и ничего не стоят
  if (instance.getLayoutProperty(LIGHTS_LAYER_ID, 'visibility') !== visibility)
    instance.setLayoutProperty(LIGHTS_LAYER_ID, 'visibility', visibility)
  instance.setPaintProperty(LIGHTS_LAYER_ID, 'line-opacity', lightsOpacity(base, dark))
}

// --- Стиль: слои возвращаются после смены темы и перехода к шару ---
let waitingForIdle = false

function sync() {
  const instance = map?.value
  if (!instance)
    return
  // isStyleLoaded() ложно и пока грузятся тайлы — дожидаемся idle, а не теряем вызов
  if (!instance.isStyleLoaded()) {
    if (!waitingForIdle) {
      waitingForIdle = true
      instance.once('idle', () => {
        waitingForIdle = false
        sync()
      })
    }
    return
  }
  if (!instance.getLayer(LIGHTS_LAYER_ID))
    ensureLayers(instance)
  keepOnTop(instance)
}

watch(styleBase, () => {
  const instance = map?.value
  if (!instance?.getLayer(LIGHTS_LAYER_ID))
    return
  // Цвет фонарей зависит от темы — проще пересоздать слой
  instance.removeLayer(LIGHTS_LAYER_ID)
  sync()
})

const timer = setInterval(apply, UPDATE_MS)

watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', sync)
  instance?.on('styledata', sync)
  sync()
}, { immediate: true })

onUnmounted(() => {
  clearInterval(timer)
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', sync)
  if (instance.getLayer(LIGHTS_LAYER_ID))
    instance.removeLayer(LIGHTS_LAYER_ID)
})
</script>

<template>
  <slot />
</template>
