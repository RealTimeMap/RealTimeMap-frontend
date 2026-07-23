<script setup lang="ts">
import BottomNavigation from '@/components/02.features/ButtonNavigation'
import { useAuthStore } from '../02.features/Authentication/model/auth'
import ShareRender from '../02.features/Share/index'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { initAuth } = authStore

const router = useRouter()
const route = useRoute()

onMounted(() => {
  initAuth()
})
</script>

<template>
  <div class="default-layout">
    <main
      class="default-layout__main"
      :class="{ 'default-layout__main--full-bleed': route.meta.fullBleed }"
    >
      <slot />
    </main>

    <footer
      v-if="!route.meta.hideBottomNav"
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

    <u-modal-wrapper />
    <share-render />
  </div>
</template>

<style lang="scss" scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  /* dvh, а не vh: иначе на мобильном layout выше вьюпорта
     на высоту адресной строки и страница уезжает под скролл */
  min-height: 100dvh;

  &__main {
    flex-grow: 1;
    position: relative;
    overflow: hidden;
    z-index: 1;
    box-sizing: border-box;
    padding-top: var(--safe-top);

    /* Карта и комната чата занимают экран целиком и отбивают
       безопасную зону сами — внутри своих плавающих элементов */
    &--full-bleed {
      padding-top: 0;
    }
  }

  &__footer {
    z-index: 1;
    svg {
      color: var(--primary-color);
    }
  }

  .chip--content {
    font-size: 12px;
  }
}
</style>
