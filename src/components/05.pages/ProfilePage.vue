<script setup lang="ts">
// import ProfileUserView from '@/components/02.features/Profile'

const dynamicColor = ref('oklch(0.62 0.22 220)')

function handleColorExtracted(color: string) {
  dynamicColor.value = color
}
</script>

<template>
  <div
    class="profile"
    :style="{ '--user-color': dynamicColor }"
  >
    <div class="profile-blum" />
    <div class="profile-container">
      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          @color-extracted="handleColorExtracted"
        />
      </router-view>
      <!-- <profile-user-view @color-extracted="handleColorExtracted" /> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile {
  height: calc(100dvh - var(--safe-top));
  width: 100%;

  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

  inset: 0px;
  background: var(--profile-bg);
  color: var(--text-color);

  &-blum {
    position: absolute;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--user-color), transparent 70%);

    filter: blur(60px);
    pointer-events: none;
  }

  &-container {
    padding-top: calc(60px - var(--safe-top));
    padding-bottom: 140px;
    width: 100%;
  }
}
</style>
