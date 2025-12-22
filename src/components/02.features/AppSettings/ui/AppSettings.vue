<script setup lang="ts">
import {
  NH3,
  NSelect,
  NSwitch,
  NThing,
} from 'naive-ui'
import { useSettingsStore } from '../model/settings'

const settingsStore = useSettingsStore()

const languageOptions = computed(() =>
  settingsStore.availableLanguages.map(lang => ({
    label: lang.toUpperCase(),
    value: lang,
  })),
)
</script>

<template>
  <div class="settings-content">
    <n-h3>{{ $t('settings.title') }}</n-h3>
    <n-thing>
      <template #header>
        {{ $t('settings.theme.title') }}
      </template>
      <template #header-extra>
        <u-theme-switcher v-model="settingsStore.currentTheme" />
      </template>
    </n-thing>
    <n-thing>
      <template #header>
        {{ $t('settings.language.title') }}
      </template>
      <template #header-extra>
        <n-select
          v-model:value="settingsStore.currentLang"
          :options="languageOptions"
          size="small"
        />
      </template>
    </n-thing>
    <n-thing>
      <template #header>
        {{ $t('settings.glassEffect.title') }}
      </template>
      <template #header-extra>
        <n-switch v-model:value="settingsStore.isGlassEffectEnabled" />
      </template>
    </n-thing>
  </div>
</template>

<style lang="scss" scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
