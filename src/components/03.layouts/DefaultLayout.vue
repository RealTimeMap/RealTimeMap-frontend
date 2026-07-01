<script setup lang="ts">
import BottomNavigation from '@/components/02.features/ButtonNavigation'
import { useAuthStore } from '../02.features/Authentication/models/auth'
import NotificationProvider from '../02.features/NotificationProvider/index'
import ShareRender from '../02.features/Share/index'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { initAuth } = authStore

const router = useRouter()

onMounted(() => {
  initAuth()
})
</script>

<template>
  <div class="default-layout">
    <main class="default-layout__main">
      <slot />
    </main>

    <footer
      class="default-layout__footer"
    >
      <u-chip
        v-if="isAuthenticated && router.currentRoute.value.name === 'home-map'"
      >
        <u-icon
          icon="tabler:hand-click"
          width="34"
        />
        <span class="chip--content">
          Двойное касание — новая метка
        </span>
      </u-chip>
      <bottom-navigation />
    </footer>

    <notification-provider />
    <u-modal-wrapper />
    <share-render />
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
    /* overflow: hidden; */
  }

  &__footer {
    svg {
      color: var(--primary-color);
    }
  }

  .chip--content {
    font-size: 12px;
  }
}
</style>
