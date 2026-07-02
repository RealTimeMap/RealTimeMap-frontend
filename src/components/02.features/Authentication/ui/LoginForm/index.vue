<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../models/useAuth'

const { t } = useI18n()
const {
  formValue,
  formErrors,
  isLoading,
  isButtonDisabled,
  submit,
  clearError,
  googleAuth,
} = useAuth()
</script>

<template>
  <form
    class="auth-form"
    @submit.prevent="submit"
  >
    <div class="auth-form__body">
      <u-input
        v-model="formValue.username"
        :placeholder="t('form.username.title')"
        :disabled="isLoading"
        :loading="isLoading"
        :error="!!formErrors.username"
        icon="line-md:account"
        @input="clearError('username')"
      />

      <u-input
        v-model="formValue.password"
        :placeholder="t('form.password.title')"
        :loading="isLoading"
        :disabled="isLoading"
        :error="!!formErrors.password"
        type="password"
        icon="solar:lock-outline"
        @input="clearError('password')"
      />
    </div>
    <button
      type="button"
      class="button__link"
    >
      Забыли пароль?
    </button>

    <button
      type="submit"
      class="button primary"
      :class="{ disable: isButtonDisabled }"
      :disabled="isButtonDisabled || isLoading"
    >
      {{ isLoading ? '...' : 'Войти' }}
    </button>

    <u-drawer text="или" />

    <div class="auth-form__social">
      <button
        type="button"
        class="button__social"
        @click="googleAuth()"
      >
        <u-icon
          icon="uil:google"
          width="16"
          height="16"
        />
        Google
      </button>
    </div>
  </form>
</template>

<style lang="scss" scoped src="./style.scss" />
