<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
} from 'naive-ui'

import NotificationProvider from '@/components/02.features/NotificationProvider/index'
import DefaultLayout from '@/components/03.layouts/DefaultLayout.vue'
import EmptyLayout from '@/components/03.layouts/EmptyLayout.vue'
import { useSettingsStore } from './components/02.features/AppSettings/model/settings'
import { initUpdateChecker } from './components/02.features/AppUpdate'
import { useNotificationStore } from './shared/stores/notification'

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

onMounted(async () => {
  await notificationStore.requestPermissions()
  initUpdateChecker()
})

const settingsStore = useSettingsStore()
</script>

<template>
  <n-config-provider
    :theme="settingsStore.theme"
    :theme-overrides="settingsStore.themeOverrides"
    :style="settingsStore.customThemeVars"
  >
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <component :is="layoutComponent">
              <router-view />
            </component>
          </n-dialog-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
    <n-global-style />
    <notification-provider />
  </n-config-provider>
</template>
