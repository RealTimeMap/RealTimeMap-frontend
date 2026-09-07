<script setup lang="ts">
// import ProfileUserView from '@/components/02.features/Profile'

const route = useRoute()
const dynamicColor = ref<string | null>(null)

function handleColorExtracted(color: string) {
  dynamicColor.value = color
}

watch(() => route.fullPath, () => {
  dynamicColor.value = null
})
</script>

<template>
  <div
    class="profile"
    :class="{ 'profile--tinted': !!dynamicColor }"
    :style="{ '--user-color': dynamicColor ?? 'transparent' }"
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
@property --user-color {
  syntax: '<color>';
  inherits: true;
  initial-value: transparent;
}

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

  // Плавный морф самого оттенка (для браузеров с поддержкой @property)
  transition: --user-color 0.6s ease;

  &-blum {
    position: absolute;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--user-color), transparent 70%);

    filter: blur(40px);
    pointer-events: none;

    opacity: 0;
    transition: opacity 0.6s ease;
  }

  &--tinted &-blum {
    opacity: 1;
  }

  &-container {
    padding-top: calc(60px - var(--safe-top));
    padding-bottom: 140px;
    width: 100%;
  }
}
</style>
