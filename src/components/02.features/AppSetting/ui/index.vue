<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth/index.ts'
import EditProfile from '@/components/02.features/EditProfile'
import Profile from './profile.vue'
import AboutSection from './sections/AboutSection.vue'
import AccountSection from './sections/AccountSection.vue'
import AppSection from './sections/AppSection.vue'
import StorageSection from './sections/StorageSection.vue'

declare const __APP_VERSION__: string
const appVersion = __APP_VERSION__

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

    <account-section />
    <app-section />
    <storage-section />
    <about-section />

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
