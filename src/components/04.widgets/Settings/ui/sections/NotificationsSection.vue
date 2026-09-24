<script setup lang="ts">
import type { NotificationType } from '@/components/00.shared/services/notification/index.type'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { initPushManager } from '@/components/02.features/app/PushManager'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'

const settings = useSettingsStore()
const notify = useNotificationStore()
const { mutedNotifications } = storeToRefs(settings)

const rows: { type: NotificationType, label: string, hint: string }[] = [
  { type: 'chat', label: 'Сообщения', hint: 'Новые сообщения в чатах' },
  { type: 'comment', label: 'Комментарии', hint: 'Ответы и комментарии к меткам' },
  { type: 'subscriber', label: 'Подписчики', hint: 'Новые подписчики' },
]

const isNative = Capacitor.isNativePlatform()
const pushGranted = ref(true)
const enabling = ref(false)

async function checkPermission() {
  try {
    if (isNative) {
      const { receive } = await PushNotifications.checkPermissions()
      pushGranted.value = receive === 'granted'
    }
    else if (typeof Notification !== 'undefined') {
      pushGranted.value = Notification.permission === 'granted'
    }
  }
  catch {
    pushGranted.value = true
  }
}

async function enablePush() {
  if (enabling.value)
    return
  enabling.value = true
  try {
    let granted = false
    if (isNative) {
      const { receive } = await PushNotifications.requestPermissions()
      granted = receive === 'granted'
    }
    else if (typeof Notification !== 'undefined') {
      granted = (await Notification.requestPermission()) === 'granted'
    }

    if (granted) {
      await initPushManager()
      pushGranted.value = true
    }
    else {
      notify.add({
        title: 'Уведомления выключены',
        description: 'Разрешите их в настройках устройства',
        type: 'warning',
      })
    }
  }
  finally {
    enabling.value = false
  }
}

function toggle(type: NotificationType, enabled: boolean) {
  settings.setNotificationType(type, enabled)
}

onMounted(checkPermission)
</script>

<template>
  <settings-section title="Уведомления">
    <button
      v-if="!pushGranted"
      class="notif-enable"
      type="button"
      :disabled="enabling"
      @click="enablePush"
    >
      <u-icon
        icon="app:warning"
        height="18"
      />
      <span class="notif-enable__text">
        Уведомления выключены. Нажмите, чтобы включить
      </span>
    </button>

    <settings-row
      v-for="row in rows"
      :key="row.type"
      :label="row.label"
      :hint="row.hint"
    >
      <template #trailing>
        <u-switch
          :model-value="!mutedNotifications[row.type]"
          :disabled="!pushGranted"
          @update:model-value="(v: boolean) => toggle(row.type, v)"
        />
      </template>
    </settings-row>
  </settings-section>
</template>

<style scoped lang="scss">
.notif-enable {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  color: var(--red-color);
  background: color-mix(in srgb, var(--red-color) 10%, transparent);
  border: none;
  border-bottom: 1px solid var(--glass-border);

  &__text {
    @include value-text(13px, var(--red-color), 600);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}
</style>
