<script setup lang="ts">
import { storeToRefs } from 'pinia'
import NotificationProvider from '@/components/02.features/NotificationProvider/index'
import DefaultLayout from '@/components/03.layouts/DefaultLayout.vue'
import EmptyLayout from '@/components/03.layouts/EmptyLayout.vue'
import { useNetworkWatch } from './components/00.shared/composables/useNetworkWatch'
import { useNotificationStore } from './components/00.shared/stores/notification'
import AccountBan from './components/02.features/AccountBan'
import { initUpdateChecker } from './components/02.features/AppUpdate'
import { useAuthStore } from './components/02.features/Authentication/model/auth'
import { initBugReport } from './components/02.features/BugReport'
import { ExpGain, useGamificationFeedback } from './components/02.features/Gamification'

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

onMounted(async () => {
  await notificationStore.requestPermissions()
  initUpdateChecker()
  initNetworkListener()
  initBugReport()
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
  </div>
</template>
