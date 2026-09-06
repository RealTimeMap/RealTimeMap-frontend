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
const router = useRouter()

function logoutProfile() {
  close()
  logout()
}

function goToLogin() {
  close()
  router.push('/login')
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
      v-if="user"
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

    <button
      v-else
      class="guest-cta"
      type="button"
      @click="goToLogin"
    >
      <div class="guest-cta__icon">
        <u-icon
          icon="solar:user-plus-bold"
          height="22"
        />
      </div>
      <div class="guest-cta__text">
        <span class="guest-cta__title">Войти в аккаунт</span>
        <span class="guest-cta__hint">Метки, достижения и синхронизация</span>
      </div>
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
      v-if="user"
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

.guest-cta {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  cursor: pointer;
  text-align: left;
  @include glass-panel(16px, 14px, false, false);
  padding-right: 40px;

  &__icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #fff;
    @include gradient();
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    @include value-text(16px, var(--text-color), 700);
  }

  &__hint {
    @include label-text(12px, none);
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
