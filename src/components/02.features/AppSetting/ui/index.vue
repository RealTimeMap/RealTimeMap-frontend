<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { storeToRefs } from 'pinia'
import { themeMeta } from '@/components/00.shared/lib/theme'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth/index.ts'
import EditProfile from '@/components/02.features/EditProfile'
import { openPrivacyPolicy } from '@/components/02.features/LegalPolicy'
import { openThemePicker } from '@/components/02.features/ThemePicker'
import Profile from './profile.vue'

declare const __APP_VERSION__: string
const appVersion = __APP_VERSION__
const isNative = Capacitor.isNativePlatform()

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { logout } = authStore
const { close, open } = useDialogStore()

function logoutProfile() {
  close()
  logout()
}

function openEditProfile() {
  if (!user.value)
    return

  open(EditProfile, {
    user: user.value,
  }, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}

const settings = useSettingsStore()
const {
  theme,
  isAppNotificationsEnabled,
  isSystemNotificationsEnabled,
  showInSearch,
  privateProfile,
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
  if (user.value)
    settings.loadProfileSettings()
})
</script>

<template>
  <div class="settings">
    <div class="settings-header">
      <button
        class="button-back"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Настройки</h2>
    </div>
    <button
      class="profile-button"
      type="button"
      @click="openEditProfile"
    >
      <profile :user="user" />
      <u-icon
        class="profile-button__chevron"
        icon="line-md:chevron-right"
        height="20"
      />
    </button>

    <section class="settings-section">
      <h3 class="settings-section__title">
        Оформление
      </h3>
      <button
        class="settings-row settings-row--link"
        type="button"
        @click="openThemePicker()"
      >
        <div class="settings-row__text">
          <span class="settings-row__label">Тема оформления</span>
          <span class="settings-row__hint">{{ themeMeta(theme).label }}</span>
        </div>
        <u-icon
          class="settings-row__chevron"
          icon="line-md:chevron-right"
          height="20"
        />
      </button>
    </section>

    <section
      v-if="user"
      class="settings-section"
    >
      <h3 class="settings-section__title">
        Приватность
      </h3>
      <div class="settings-row">
        <div class="settings-row__text">
          <span class="settings-row__label">Показывать в поиске</span>
          <span class="settings-row__hint">Профиль виден в результатах поиска</span>
        </div>
        <u-switch
          :model-value="showInSearch"
          @update:model-value="settings.setShowInSearch"
        />
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <span class="settings-row__label">Закрытый профиль</span>
          <span class="settings-row__hint">Содержимое доступно только друзьям</span>
        </div>
        <u-switch
          :model-value="privateProfile"
          @update:model-value="settings.setPrivateProfile"
        />
      </div>
    </section>

    <section class="settings-section">
      <h3 class="settings-section__title">
        Уведомления
      </h3>
      <div class="settings-row">
        <div class="settings-row__text">
          <span class="settings-row__label">Уведомления приложения</span>
          <span class="settings-row__hint">Всплывающие сообщения внутри приложения</span>
        </div>
        <u-switch v-model="isAppNotificationsEnabled" />
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <span class="settings-row__label">Системные уведомления</span>
          <span class="settings-row__hint">Пуши на устройстве</span>
        </div>
        <u-switch v-model="isSystemNotificationsEnabled" />
      </div>
    </section>

    <section class="settings-section">
      <h3 class="settings-section__title">
        Кеш
      </h3>
      <div class="settings-row">
        <div class="settings-row__text">
          <span class="settings-row__label">Приложение</span>
          <span class="settings-row__hint">
            {{ isCalculating ? 'Подсчёт…' : formattedCacheSize }}
          </span>
        </div>
        <button
          class="button-clear"
          :disabled="isClearing"
          @click="settings.clearCache()"
        >
          {{ isClearing ? 'Очистка…' : 'Очистить' }}
        </button>
      </div>

      <div
        v-if="isNative"
        class="settings-row"
      >
        <div class="settings-row__text">
          <span class="settings-row__label">Карта</span>
          <span class="settings-row__hint">
            {{ isCalculatingMap ? 'Подсчёт…' : formattedMapCacheSize }}
          </span>
        </div>
        <button
          class="button-clear"
          :disabled="isClearingMap"
          @click="settings.clearMapCache()"
        >
          {{ isClearingMap ? 'Очистка…' : 'Очистить' }}
        </button>
      </div>
    </section>

    <section class="settings-section">
      <h3 class="settings-section__title">
        Правовая информация
      </h3>
      <button
        class="settings-row settings-row--link"
        type="button"
        @click="openPrivacyPolicy()"
      >
        <div class="settings-row__text">
          <span class="settings-row__label">Политика конфиденциальности</span>
          <span class="settings-row__hint">Обработка персональных данных (152-ФЗ)</span>
        </div>
        <u-icon
          class="settings-row__chevron"
          icon="line-md:chevron-right"
          height="20"
        />
      </button>
    </section>

    <button
      class="button-logout"
      @click="logoutProfile"
    >
      <u-icon icon="line-md:logout" />
      Выйти из аккаунта
    </button>
    <span class="version">
      RealTimeMap · версия {{ appVersion }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  // height: 100%;
  padding-bottom: 20px;
}

.settings-header {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;

  .button-back {
    @include glass-panel(12px, 10px, false);
  }

  h2 {
    @include value-text(24px, var(--text-color), 700);
  }
}

.profile-button {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;

  :deep(.profile) {
    flex: 1;
    padding-right: 40px;
  }

  &__chevron {
    position: absolute;
    right: 14px;
    color: var(--text-color-secondary, var(--text-color-secondary));
    pointer-events: none;
  }
}

.settings-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__title {
    @include label-text(12px, uppercase);
  }
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  @include glass-panel(16px, 14px, false);

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  &__label {
    @include value-text(15px, var(--text-color), 600);
  }

  &__hint {
    @include label-text(12px, none);
    font-variant-numeric: tabular-nums;
  }

  &--link {
    width: 100%;
    cursor: pointer;
    text-align: left;
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--text-color-secondary, var(--text-color-secondary));
  }
}

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

.button-logout {
  width: 100%;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: rgba(229, 72, 77, 0.1);
  border: 1px solid rgba(229, 72, 77, 0.3);
  border-radius: 16px;
  padding: 16px;
  @include value-text(16px, rgb(255, 113, 118), 600);
  cursor: pointer;
}

.version {
  @include label-text(12px, none);
}
</style>
