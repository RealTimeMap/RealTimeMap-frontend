<script setup lang="ts">
import { useSettingsStore } from '@/components/02.features/AppSettings/model/settings'

interface Props {
  scale?: number
  enabledGlass?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  scale: 40,
  enabledGlass: true,
})

let uid = 0
const getUid = () => uid++
const filterId = `glass-distortion-${getUid()}`

const wrapperStyle = computed(() => ({
  '--filter-url': `url(#${filterId})`,
}))

const settingsStore = useSettingsStore()

const showGlassEffect = computed(() => {
  return settingsStore.isGlassEffectEnabled && props.enabledGlass
})
</script>

<template>
  <div
    class="liquid-glass-wrapper"
    :style="wrapperStyle"
  >
    <svg style="display: none;">
      <defs>
        <filter :id="filterId">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />
          <feGaussianBlur
            in="turbulence"
            stdDeviation="3"
            result="softMap"
          />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lighting-color="white"
            result="specLight"
          >
            <fePointLight
              x="-200"
              y="-200"
              z="300"
            />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            :scale="props.scale"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>

    <div class="liquid-glass-tint" />
    <template v-if="showGlassEffect">
      <div class="liquid-glass-effect" />
    </template>
    <template v-else>
      <div class="liquid-no-glass" />
    </template>
    <div class="liquid-glass-shine" />

    <div class="liquid-glass-content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.liquid-glass-wrapper {
  position: relative;
  box-shadow:
    0 6px 6px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(0, 0, 0, 0.1);
}

.liquid-glass-effect {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  backdrop-filter: blur(1px);
  filter: var(--filter-url);
}

.liquid-no-glass {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  backdrop-filter: blur(4px);
}

.liquid-glass-tint {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  background: var(--glass-background);
}

.liquid-glass-shine {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  box-shadow:
    inset 1px 1px 1px 0 var(--glass-shine),
    inset -1px -1px 1px 0 var(--glass-shine);
}

.liquid-glass-content {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
}
</style>
