<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { SeasonPalette, SeasonProperty } from '../model/seasonPalette'
import type { ThemeBase } from '@/components/00.shared/lib/theme'
import { storeToRefs } from 'pinia'
import { fixedSeason, seasonAt } from '@/components/00.shared/lib/season'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { paletteFor, SEASON_TARGETS, seasonValue } from '../model/seasonPalette'

/** Сезон меняется медленно — раз в час достаточно. */
const UPDATE_MS = 60 * 60_000
/** Имя стиля CARTO → тема. Тему берём из загруженного стиля, а не из настроек: при смене темы стиль приходит позже. */
const STYLE_BASE: Record<string, ThemeBase> = { 'Positron': 'light', 'Dark Matter': 'dark' }

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { mapSeason } = storeToRefs(useSettingsStore())

// Исходные цвета стиля — чтобы вернуть их при «Выкл.» и при уходе со страницы
const originals = new Map<string, Map<string, unknown>>()
const targetKey = (layer: string, property: string) => `${layer}|${property}`

function captureOriginals(instance: maplibregl.Map, styleName: string) {
  if (originals.has(styleName))
    return
  const values = new Map<string, unknown>()
  for (const { layer, property } of SEASON_TARGETS) {
    if (instance.getLayer(layer))
      values.set(targetKey(layer, property), instance.getPaintProperty(layer, property))
  }
  originals.set(styleName, values)
}

function setIfChanged(instance: maplibregl.Map, layer: string, property: SeasonProperty, value: unknown) {
  // setPaintProperty вызывает styledata — без сравнения получился бы цикл
  if (value === undefined || JSON.stringify(instance.getPaintProperty(layer, property)) === JSON.stringify(value))
    return
  instance.setPaintProperty(layer, property, value as string)
}

function palette(base: ThemeBase, instance: maplibregl.Map): SeasonPalette | null {
  if (mapSeason.value === 'off')
    return null
  if (mapSeason.value === 'auto')
    return paletteFor(base, seasonAt(new Date(), instance.getCenter().lat))
  return paletteFor(base, fixedSeason(mapSeason.value))
}

function apply() {
  const instance = map?.value
  if (!instance?.getLayer('background'))
    return
  const styleName = instance.getStyle().name ?? ''
  const base = STYLE_BASE[styleName]
  if (!base)
    return
  captureOriginals(instance, styleName)
  const colors = palette(base, instance)
  const restore = originals.get(styleName)!
  for (const target of SEASON_TARGETS) {
    const { layer, property } = target
    if (instance.getLayer(layer))
      setIfChanged(instance, layer, property, colors ? seasonValue(target, colors) : restore.get(targetKey(layer, property)))
  }
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

watch(mapSeason, apply)

watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', scheduleApply)
  instance?.on('styledata', scheduleApply)
  scheduleApply()
}, { immediate: true })

const timer = setInterval(apply, UPDATE_MS)

onUnmounted(() => {
  clearInterval(timer)
  cancelAnimationFrame(frame)
  const instance = map?.value
  if (!instance)
    return
  instance.off('styledata', scheduleApply)
  const restore = originals.get(instance.getStyle()?.name ?? '')
  for (const { layer, property } of SEASON_TARGETS) {
    if (restore && instance.getLayer(layer))
      setIfChanged(instance, layer, property, restore.get(targetKey(layer, property)))
  }
})
</script>

<template>
  <slot />
</template>
