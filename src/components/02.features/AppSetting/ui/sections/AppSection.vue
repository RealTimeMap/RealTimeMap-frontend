<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { isAndroid } from '@/components/00.shared/lib/platform'
import { preferenceLabel } from '@/components/00.shared/lib/theme'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { downloadAndroidApp } from '@/components/02.features/AppUpdate'
import { openThemePicker } from '@/components/02.features/ThemePicker'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'

const settings = useSettingsStore()
const {
  theme,
  isAppNotificationsEnabled,
  isSystemNotificationsEnabled,
  isHapticsEnabled,
} = storeToRefs(settings)

const showDownloadApp = !isAndroid()
const showHaptics = false
</script>

<template>
  <settings-section title="Приложение">
    <settings-row
      link
      label="Тема оформления"
      :hint="preferenceLabel(theme)"
      @click="openThemePicker()"
    />

    <settings-row
      label="Уведомления приложения"
      hint="Всплывающие сообщения внутри приложения"
    >
      <template #trailing>
        <u-switch v-model="isAppNotificationsEnabled" />
      </template>
    </settings-row>

    <settings-row
      label="Системные уведомления"
      hint="Пуши на устройстве"
    >
      <template #trailing>
        <u-switch v-model="isSystemNotificationsEnabled" />
      </template>
    </settings-row>

    <settings-row
      v-if="showHaptics"
      label="Вибрация"
      hint="Тактильный отклик на действия"
    >
      <template #trailing>
        <u-switch v-model="isHapticsEnabled" />
      </template>
    </settings-row>

    <settings-row
      v-if="showDownloadApp"
      link
      label="Скачать приложение"
      hint="Версия для Android (.apk)"
      chevron="solar:download-minimalistic-bold"
      @click="downloadAndroidApp()"
    />
  </settings-section>
</template>
