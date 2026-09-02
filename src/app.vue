<script setup lang="ts">
import NotificationProvider from '@/components/02.features/NotificationProvider/index'
import DefaultLayout from '@/components/03.layouts/DefaultLayout.vue'
import EmptyLayout from '@/components/03.layouts/EmptyLayout.vue'
import { useNetworkWatch } from './components/00.shared/composables/useNetworkWatch'
import { useNotificationStore } from './components/00.shared/stores/notification'
import { initUpdateChecker } from './components/02.features/AppUpdate'
import { initBugReport } from './components/02.features/BugReport'

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
  </div>
</template>
