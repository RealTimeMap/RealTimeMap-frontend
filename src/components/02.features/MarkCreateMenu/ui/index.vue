<script setup lang="ts">
import type { MapPoint } from '@/types/shared/map'
import BarMenu from './BarMenu.vue'
import OrbitMenu from './OrbitMenu.vue'
import PopoverMenu from './PopoverMenu.vue'

const props = defineProps<{
  variant: 'popover' | 'orbit' | 'bar'
  x: number
  y: number
  coords: MapPoint
}>()

const emit = defineEmits<{
  (e: 'public'): void
  (e: 'private'): void
  (e: 'close'): void
  (e: 'move', x: number, y: number): void
}>()

const component = computed(() => {
  switch (props.variant) {
    case 'orbit': return OrbitMenu
    case 'bar': return BarMenu
    default: return PopoverMenu
  }
})
</script>

<template>
  <component
    :is="component"
    :x="x"
    :y="y"
    :coords="coords"
    @public="emit('public')"
    @private="emit('private')"
    @move="(mx: number, my: number) => emit('move', mx, my)"
    @close="emit('close')"
  />
</template>
