<script setup lang="ts">
import { openBugReport } from '@/components/02.features/BugReport'
import { openPrivacyPolicy } from '@/components/02.features/LegalPolicy'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'
</script>

<template>
  <settings-section title="О приложении">
    <settings-row
      link
      label="Сообщить о баге"
      hint="Опишите проблему — приложим логи и данные устройства"
      @click="openBugReport()"
    />

    <settings-row
      link
      label="Политика конфиденциальности"
      hint="Обработка персональных данных (152-ФЗ)"
      @click="openPrivacyPolicy()"
    />
  </settings-section>
</template>
