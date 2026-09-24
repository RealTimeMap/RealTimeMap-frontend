<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<{
  /**
   * Icon name from Iconify collection
   * @example 'app:home' or 'app:arrow-left'
   */
  icon: string
  width?: string | number
  height?: string | number
  /**
   * false — бесконечные SMIL-анимации иконки проигрываются один раз и замирают в исходной позе.
   * При возврате в true анимация перезапускается с начала.
   */
  loop?: boolean
}>(), {
  loop: true,
})

const iconRef = ref<ComponentPublicInstance | null>(null)

function applyLoop(restart: boolean) {
  const svg = iconRef.value?.$el
  if (!(svg instanceof SVGSVGElement))
    return

  let hasLoops = false
  svg.querySelectorAll('animate, animateTransform, animateMotion').forEach((anim) => {
    if (!anim.hasAttribute('data-loop')) {
      if (anim.getAttribute('repeatCount') !== 'indefinite')
        return
      anim.setAttribute('data-loop', '')
    }
    hasLoops = true
    anim.setAttribute('repeatCount', props.loop ? 'indefinite' : '1')
  })

  if (hasLoops && restart)
    svg.setCurrentTime(0)
}

function onLoad() {
  if (!props.loop)
    applyLoop(false)
}

watch(() => props.loop, loop => applyLoop(loop))
</script>

<template>
  <icon
    ref="iconRef"
    :icon="icon"
    :width="width"
    :height="height"
    @load="onLoad"
  />
</template>

<style scoped>
.iconify {
  color: inherit;
}
</style>
