<script setup lang="ts">
import { storeToRefs } from 'pinia'
import NotificationProvider from '@/components/02.features/NotificationProvider/index'
import DefaultLayout from '@/components/03.layouts/DefaultLayout.vue'
import EmptyLayout from '@/components/03.layouts/EmptyLayout.vue'
import { useNetworkWatch } from './components/00.shared/composables/useNetworkWatch'
import { useNotificationStore } from './components/00.shared/stores/notification'
import { useSettingsStore } from './components/00.shared/stores/settings'
import AccountBan from './components/02.features/AccountBan'
import { initUpdateChecker } from './components/02.features/AppUpdate'
import { useAuthStore } from './components/02.features/Authentication/model/auth'
import { initBugReport } from './components/02.features/BugReport'
import { ExpGain, useGamificationFeedback } from './components/02.features/Gamification'
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

const notificationStore = useNotificationStore()
const { initNetworkListener } = useNetworkWatch()
const { xpGain } = useGamificationFeedback()
const { banInfo } = storeToRefs(useAuthStore())
const { splashStyle } = storeToRefs(useSettingsStore())

/** Приложение проинициализировано — стартовый сплэш может уходить. */
const appReady = ref(false)
/** Сплэш ещё в DOM (только если стиль не 'off'). */
const splashVisible = ref(splashStyle.value !== 'off')
/** Стиль для компонента сплэша (без 'off'). Зафиксирован на момент старта. */
const splashAnim = computed(() =>
  splashStyle.value === 'off' ? 'shield' : splashStyle.value,
)

onMounted(async () => {
  await notificationStore.requestPermissions()
  initUpdateChecker()
  initNetworkListener()
  initBugReport()
  appReady.value = true
})
</script>

<template>
  <div
    class="app-wrapper"
  >
    <component :is="layoutComponent">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['HomeMapPage']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </component>

    <notification-provider />

    <exp-gain
      v-if="xpGain"
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
