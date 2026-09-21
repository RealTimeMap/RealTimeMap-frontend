<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { MARK_MENU_STYLE_LABELS, openMarkMenuStylePicker } from '@/components/02.features/MarkCreateMenu'
import { openSplashStylePicker, SPLASH_STYLE_LABELS } from '@/components/02.features/SplashScreen'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'

const settings = useSettingsStore()
const { markMenuStyle, splashStyle } = storeToRefs(settings)
</script>

<template>
  <settings-section title="Экспериментальные функции">
    <settings-row
      link
      label="Меню создания метки"
      :hint="MARK_MENU_STYLE_LABELS[markMenuStyle]"
      chevron="app:pin-plus"
      @click="openMarkMenuStylePicker()"
    />

    <settings-row
      link
      label="Анимация запуска"
      :hint="SPLASH_STYLE_LABELS[splashStyle]"
      chevron="app:magic"
      @click="openSplashStylePicker()"
    />
  </settings-section>
</template>
