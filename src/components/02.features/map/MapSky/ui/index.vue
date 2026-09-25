<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { sunPosition } from '@/components/00.shared/lib/sun'
import { themeBase } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { skyFor } from '../model/skyColors'

const SKY_UPDATE_MS = 5 * 60_000

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { resolvedTheme } = storeToRefs(useSettingsStore())

// Небо считается по таймеру и теме, а на styledata только возвращается: setSky сам вызывает styledata
let sky: maplibregl.SkySpecification | null = null
/** Небо, каким его вернула карта после нашего setSky, — сравниваем с ним, а не со своим объектом. */
let applied = ''

function compute(instance: maplibregl.Map) {
  const { lng, lat } = instance.getCenter()
  sky = skyFor(themeBase(resolvedTheme.value), sunPosition(new Date(), lng, lat))
}

function apply() {
  const instance = map?.value
  if (!instance)
    return
  if (!sky)
    compute(instance)
  if (JSON.stringify(instance.getSky()) === applied)
    return
  try {
    instance.setSky(sky!)
    applied = JSON.stringify(instance.getSky())
  }
  catch {
    // Стиль ещё не загружен — повторим на следующем styledata
  }
}

function refresh() {
  const instance = map?.value
  if (!instance)
    return
  compute(instance)
  applied = ''
  apply()
}

const timer = setInterval(refresh, SKY_UPDATE_MS)
watch(resolvedTheme, refresh)

// Смена темы (setStyle с diff) может сбросить небо стиля — возвращаем своё
watch(() => map?.value, (instance, previous) => {
  previous?.off('styledata', apply)
  instance?.on('styledata', apply)
  apply()
}, { immediate: true })

onUnmounted(() => {
  clearInterval(timer)
  map?.value?.off('styledata', apply)
})
</script>

<template>
  <slot />
</template>
