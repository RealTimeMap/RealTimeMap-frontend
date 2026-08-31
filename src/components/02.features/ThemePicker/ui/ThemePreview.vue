<script setup lang="ts">
import type { ThemeName } from '@/components/00.shared/lib/theme'

defineProps<{
  theme: ThemeName
}>()
</script>

<template>
  <div
    class="theme-preview"
    :class="`theme-${theme}`"
  >
    <svg
      class="theme-preview__map"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect
        x="0"
        y="0"
        width="320"
        height="180"
        class="map-base"
      />

      <!-- кварталы -->
      <rect
        x="18"
        y="18"
        width="74"
        height="42"
        rx="8"
        class="map-block"
      />
      <rect
        x="228"
        y="20"
        width="78"
        height="52"
        rx="8"
        class="map-block"
      />
      <rect
        x="120"
        y="112"
        width="86"
        height="52"
        rx="8"
        class="map-block"
      />
      <rect
        x="232"
        y="112"
        width="72"
        height="52"
        rx="8"
        class="map-block"
      />

      <path
        d="M0 84 H320"
        class="map-road"
      />
      <path
        d="M110 0 V180"
        class="map-road"
      />

      <path
        d="M52 150 L52 84 L214 84 L214 46"
        class="map-route"
      />

      <circle
        cx="52"
        cy="150"
        r="7"
        class="map-start"
      />

      <g class="map-pin">
        <path d="M214 30 c-8 0 -14 6 -14 14 c0 10 14 22 14 22 s14 -12 14 -22 c0 -8 -6 -14 -14 -14 z" />
        <circle
          cx="214"
          cy="44"
          r="5"
          class="map-pin__dot"
        />
      </g>
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.theme-preview {
  border-radius: 20px;
  overflow: hidden;
  border: 0.5px solid var(--glass-border);
  box-shadow: var(--glass-shadow) 0px 8px 24px;
  line-height: 0;
}

.theme-preview__map {
  display: block;
  width: 100%;
  height: 200px;
}

.map-base {
  fill: var(--bg-body);
}

.map-block {
  fill: var(--surface-strong);
}

.map-road {
  stroke: var(--surface-hover);
  stroke-width: 14;
  stroke-linecap: round;
  fill: none;
}

.map-route {
  stroke: var(--primary-color);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.map-start {
  fill: var(--primary-color);
  stroke: #fff;
  stroke-width: 2.5;
}

.map-pin {
  fill: var(--primary-color);
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3));

  &__dot {
    fill: #fff;
  }
}
</style>
