<script setup lang="ts">
import { storeToRefs } from 'pinia'
import NotificationProvider from '@/components/02.features/NotificationProvider/index'
import DefaultLayout from '@/components/03.layouts/DefaultLayout.vue'
import EmptyLayout from '@/components/03.layouts/EmptyLayout.vue'
import { useNetworkWatch } from './components/00.shared/composables/useNetworkWatch'
import { isPageTransitioning, pageTransition, prefetchNavData, prefetchNavPages } from './components/00.shared/lib/pageTransition'
import { initPlacesSync } from './components/00.shared/stores/places'
import { useSettingsStore } from './components/00.shared/stores/settings'
import AccountBan from './components/02.features/AccountBan'
import { initUpdateChecker } from './components/02.features/AppUpdate'
import { useAuthStore } from './components/02.features/Authentication/model/auth'
import { initBugReport } from './components/02.features/BugReport'
import { ExpGain, useGamificationFeedback } from './components/02.features/Gamification'
import { initPushManager } from './components/02.features/PushManager'
import { AppSplash } from './components/02.features/SplashScreen'

const layouts = {
  empty: EmptyLayout,
  default: DefaultLayout,
}
const route = useRoute()

const layoutComponent = computed(() => {
  const layoutName = route.meta.layout as keyof typeof layouts || 'empty'
  return layouts[layoutName] || EmptyLayout
})

const transitionKey = computed(() => route.path)

const { initNetworkListener } = useNetworkWatch()
const { xpGain } = useGamificationFeedback()
const authStore = useAuthStore()
const { banInfo } = storeToRefs(authStore)
const { splashStyle } = storeToRefs(useSettingsStore())

const appReady = ref(false)
const splashVisible = ref(splashStyle.value !== 'off')
const splashAnim = computed(() =>
  splashStyle.value === 'off' ? 'shield' : splashStyle.value,
)

onMounted(async () => {
  initUpdateChecker()
  initNetworkListener()
  initBugReport()
  initPlacesSync()

  if (authStore.isAuthenticated) {
    await initPushManager()
  }

  appReady.value = true
  prefetchNavPages()
  prefetchNavData(authStore.isAuthenticated)
})
</script>

<template>
  <div
    class="app-wrapper"
  >
    <component :is="layoutComponent">
      <router-view v-slot="{ Component }">
        <transition
          :name="pageTransition"
          @before-enter="isPageTransitioning = true"
          @after-enter="isPageTransitioning = false"
          @enter-cancelled="isPageTransitioning = false"
        >
          <keep-alive :include="['HomeMapPage']">
            <component
              :is="Component"
              :key="transitionKey"
            />
          </keep-alive>
        </transition>
      </router-view>
    </component>

    <notification-provider />

    <exp-gain
      v-if="xpGain && !splashVisible"
      :key="xpGain.key"
      :amount="xpGain.amount"
    />

    <account-ban v-if="banInfo" />

    <app-splash
      v-if="splashVisible && splashStyle !== 'off'"
      :variant="splashAnim"
      :done="appReady"
      @hidden="splashVisible = false"
    />
  </div>
</template>

<style lang="scss">
$page-transition-duration: 0.38s;
$page-transition-easing: cubic-bezier(0.36, 0.66, 0.04, 1);

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  position: absolute;
  inset: 0;
  transition:
    transform $page-transition-duration $page-transition-easing,
    filter $page-transition-duration $page-transition-easing;
  will-change: transform, filter;
  background: var(--bg-body);
  backface-visibility: hidden;
}

.slide-left-leave-active,
.slide-right-enter-active {
  box-shadow: none;
}

.slide-left-enter-active {
  z-index: 2;
}
.slide-left-leave-active {
  z-index: 1;
}

.slide-left-enter-from {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-30%);
  filter: brightness(0.85);
}

.slide-right-enter-active {
  z-index: 1;
}
.slide-right-leave-active {
  z-index: 2;
}

.slide-right-enter-from {
  transform: translateX(-30%);
  filter: brightness(0.85);
}
.slide-right-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
  position: absolute;
  inset: 0;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.suspense-fallback {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--bg-body);
}
</style>
