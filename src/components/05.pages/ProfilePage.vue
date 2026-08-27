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
  min-height: calc(100dvh - var(--safe-top));
  width: 100%;

  /* overflow-x: hidden; */
  /* overflow-y: auto; */
  -webkit-overflow-scrolling: touch;

  inset: 0px;
  background: linear-gradient(oklch(0.16 0.04 220) 0%, oklch(0.09 0.02 220) 60%);
  color: rgb(255, 255, 255);

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
