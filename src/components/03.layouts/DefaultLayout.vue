<script setup lang="ts">
import GuestView from '@/components/02.features/Authentication/'
import BottomNavigation from '@/components/02.features/ButtonNavigation'
import UserView from '@/components/02.features/Profile'
import AppSettings from '../02.features/AppSettings'
import { useAuthStore } from '../02.features/Authentication/model/auth'

const activeNavItem = ref('Map')

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { initAuth } = authStore

onMounted(() => {
  initAuth()
})
</script>

<template>
  <div class="default-layout">
    <main class="default-layout__main">
      <slot />
    </main>

    <footer class="default-layout__footer">
      <bottom-navigation v-model:active-item="activeNavItem" />
    </footer>

    <u-app-panel :show="activeNavItem === 'Settings'">
      <app-settings />
    </u-app-panel>

    <u-app-panel :show="activeNavItem === 'Person'">
      <Transition
        name="fade"
        mode="out-in"
      >
        <component
          :is="isAuthenticated ? UserView : GuestView"
        />
      </Transition>
    </u-app-panel>

    <u-modal-wrapper />
  </div>
</template>

<style lang="scss" scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__main {
    flex-grow: 1;
    position: relative;
  }
}
</style>
