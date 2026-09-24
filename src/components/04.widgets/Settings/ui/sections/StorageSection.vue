<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'

const isNative = Capacitor.isNativePlatform()
const settings = useSettingsStore()
const {
  formattedCacheSize,
  isCalculating,
  isClearing,
  formattedMapCacheSize,
  isCalculatingMap,
  isClearingMap,
} = storeToRefs(settings)

onMounted(() => {
  settings.calculateCacheSize()
  if (isNative)
    settings.calculateMapCacheSize()
})
</script>

<template>
  <settings-section title="Хранилище">
    <settings-row
      label="Кеш приложения"
      :hint="isCalculating ? 'Подсчёт…' : formattedCacheSize"
    >
      <template #trailing>
        <button
          class="button-clear"
          :disabled="isClearing"
          @click="settings.clearCache()"
        >
          {{ isClearing ? 'Очистка…' : 'Очистить' }}
        </button>
      </template>
    </settings-row>

    <settings-row
      v-if="isNative"
      label="Кеш карты"
      :hint="isCalculatingMap ? 'Подсчёт…' : formattedMapCacheSize"
    >
      <template #trailing>
        <button
          class="button-clear"
          :disabled="isClearingMap"
          @click="settings.clearMapCache()"
        >
          {{ isClearingMap ? 'Очистка…' : 'Очистить' }}
        </button>
      </template>
    </settings-row>
  </settings-section>
</template>

<style lang="scss" scoped>
.button-clear {
  flex-shrink: 0;
  min-width: 104px;
  text-align: center;
  padding: 9px 16px;
  border-radius: 12px;
  background: rgba(229, 72, 77, 0.1);
  border: 1px solid rgba(229, 72, 77, 0.3);
  @include value-text(14px, rgb(255, 113, 118), 600);
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
