<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { MARK_MENU_STYLE_LABELS, openMarkMenuStylePicker } from '@/components/02.features/MarkCreateMenu'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'

const settings = useSettingsStore()
const { markMenuStyle } = storeToRefs(settings)
</script>

<template>
  <settings-section title="Экспериментальные функции">
    <settings-row
      link
      label="Меню создания метки"
      :hint="MARK_MENU_STYLE_LABELS[markMenuStyle]"
      chevron="solar:map-point-add-bold"
      @click="openMarkMenuStylePicker()"
    />
  </settings-section>
</template>
