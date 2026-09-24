<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/components/00.shared/stores/auth'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { openActiveSessions } from '@/components/02.features/settings/ActiveSessions'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'

const { user } = storeToRefs(useAuthStore())
const settings = useSettingsStore()
const { showInSearch, privateProfile } = storeToRefs(settings)

onMounted(() => {
  if (user.value)
    settings.loadProfileSettings()
})
</script>

<template>
  <settings-section
    v-if="user"
    title="Аккаунт"
  >
    <settings-row
      label="Показывать в поиске"
      hint="Профиль виден в результатах поиска"
    >
      <template #trailing>
        <u-switch
          :model-value="showInSearch"
          @update:model-value="settings.setShowInSearch"
        />
      </template>
    </settings-row>

    <settings-row
      label="Закрытый профиль"
      hint="Содержимое доступно только друзьям"
    >
      <template #trailing>
        <u-switch
          :model-value="privateProfile"
          @update:model-value="settings.setPrivateProfile"
        />
      </template>
    </settings-row>

    <settings-row
      label="Активные сессии"
      hint="Устройства, с которых выполнен вход"
      link
      @click="openActiveSessions"
    />
  </settings-section>
</template>
