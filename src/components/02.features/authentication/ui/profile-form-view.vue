<script setup lang="ts">
import {
  NButton,
  NDivider,
  NForm,
  NTabPane,
  NTabs,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/utils/auth'
import { useAuthForm } from '../models/useAuthForm'

const {
  formRef,
  formValue,
  rules,
  authMode,
  submitButtonText,
  isLoading,
  formErrors,
  handleTabChange,
  handleValidateClick,
  clearErrors,
} = useAuthForm()

async function googleAuth() {
  try {
    const response = await authApi.googleAuth()
    window.location.href = response.authorization_url
  }
  catch (error) {
    console.error('Google Auth Error:', error)
  }
}

const { t } = useI18n()
</script>

<template>
  <div class="auth-form-container">
    <!-- <n-avatar
      :size="60"
      class="avatar-user"
      round
      src="https://avatars.githubusercontent.com/u/83133043?v=4"
    /> -->
    <n-tabs
      :value="authMode"
      class="auth-tabs"
      type="segment"
      animated
      @update:value="handleTabChange"
    >
      <n-tab-pane
        name="login"
        :tab="t('auth.login')"
      />
      <n-tab-pane
        name="register"
        :tab="t('auth.register')"
      />
    </n-tabs>

    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      class="auth-form-body"
    >
      <div
        v-if="formErrors.general"
        class="error-message general-error"
        role="alert"
      >
        {{ formErrors.general }}
      </div>
      <u-input
        v-model="formValue.username"
        :label="t('form.username.title')"
        :disabled="isLoading"
        :loading="isLoading"
        :error="!!formErrors.username"
        type="text"
        @input="clearErrors('username')"
      />

      <u-input
        v-if="authMode === 'register'"
        v-model="formValue.email"
        :label="t('form.email')"
        :disabled="isLoading"
        :loading="isLoading"
        :error="!!formErrors.email"
        type="email"
        @input="clearErrors('email')"
      />

      <u-input
        v-model="formValue.password"
        :label="t('form.password.title')"
        :loading="isLoading"
        :disabled="isLoading"
        :error="!!formErrors.password"
        type="password"
        @input="clearErrors('password')"
      />

      <u-input
        v-if="authMode === 'register'"
        v-model="formValue.repeatPassword"
        :label="t('form.repeatPassword.title')"
        :loading="isLoading"
        :disabled="isLoading"
        :error="!!formErrors.repeatPassword"
        type="password"
        @input="clearErrors('repeatPassword')"
      />

      <n-button
        type="primary"
        :loading="isLoading"
        size="large"
        @click="handleValidateClick"
      >
        {{ submitButtonText }}
      </n-button>

      <n-divider>Или</n-divider>

      <n-button
        size="large"
        class="google-btn"
        :disabled="isLoading"
        @click="googleAuth"
      >
        <template #icon>
          <u-icon icon="material-icon-theme:google" />
        </template>
        Войти через Google
      </n-button>
    </n-form>
  </div>
</template>

<style lang="scss" scoped>
.auth-form-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 400px;

  .avatar-user {
    position: absolute;
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 10px 0 var(--primary-color);
  }
}

.google-btn {
  width: 100%;
  font-weight: 500;
  color: #3c4043;
  background-color: #fff;
  border: 1px solid #dadce0;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f7f8f8;
    border-color: #d2e3fc;
    color: #202124;
  }

  &:focus {
    background-color: #f7f8f8;
  }
}

.auth-tabs {
  :deep(.n-tabs-rail) {
    border-radius: 8px;
  }
}

:deep(.n-divider) {
  display: flex;
  align-items: center;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  margin: 4px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e5e7eb;
  }

  &::before {
    margin-right: 0.5em;
  }

  &::after {
    margin-left: 0.5em;
  }
}
</style>
