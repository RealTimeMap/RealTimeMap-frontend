<script setup lang="ts">
import BottomNavigation from '@/components/02.features/ButtonNavigation'
import { useAuthStore } from '../02.features/Authentication/model/auth'

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

    <footer
      class="default-layout__footer"
    >
      <u-chip
        v-if="isAuthenticated"
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
