<script setup lang="ts">
import ProfileUserView from '@/components/02.features/Profile/ui/ProfileUserView.vue'
</script>

<template>
  <div class="profile">
    <div class="profile-blum" />
    <div class="profile-container">
      <profile-user-view />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile {
  min-height: 100dvh;
  width: 100%;

  overflow-x: hidden;
  overflow-y: auto;
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
    background: radial-gradient(circle, oklch(0.62 0.22 220 / 0.27), transparent 70%);
    filter: blur(60px);
    pointer-events: none;
  }

  &-container {
    padding-top: 60px;
    padding-bottom: 140px;
    width: 100%;
  }
}
</style>
