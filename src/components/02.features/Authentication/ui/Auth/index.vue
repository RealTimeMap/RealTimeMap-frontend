<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { openPrivacyPolicy } from '@/components/02.features/LegalPolicy'
import { useAuth } from '../../model/useAuth'

const { t } = useI18n()
const {
  formValue,
  formErrors,
  isLoading,
  isButtonDisabled,
  submit,
  clearError,
  isRegister,
  isConsentGiven,
  googleAuth,
  toggleMode,
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
        v-if="isRegister"
        v-model="formValue.email"
        :placeholder="t('form.email.title', 'Email')"
        :disabled="isLoading"
        :loading="isLoading"
        :error="!!formErrors.email"
        icon="solar:letter-outline"
        @input="clearError('email')"
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
      v-if="!isRegister"
      type="button"
      class="button__link"
    >
      Забыли пароль?
    </button>

    <label
      v-if="isRegister"
      class="auth-form__consent"
      :class="{ 'auth-form__consent--checked': isConsentGiven }"
    >
      <input
        v-model="isConsentGiven"
        type="checkbox"
        class="auth-form__consent-input"
      >
      <span class="auth-form__consent-box">
        <u-icon
          class="auth-form__consent-check"
          icon="material-symbols:check-rounded"
          height="15"
        />
      </span>
      <span class="auth-form__consent-text">
        Я принимаю
        <button
          type="button"
          class="auth-form__consent-link"
          @click="openPrivacyPolicy()"
        >
          Политику конфиденциальности
        </button>
        и даю согласие на обработку персональных данных
      </span>
    </label>

    <button
      type="submit"
      class="button primary"
      :class="{ disable: isButtonDisabled }"
      :disabled="isButtonDisabled || isLoading"
    >
      <span v-if="isLoading">...</span>
      <span v-else>{{ isRegister ? 'Создать аккаунт' : 'Войти' }}</span>
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

    <div class="auth-form__footer">
      {{ isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?' }}
      <button
        type="button"
        @click="toggleMode"
      >
        {{ isRegister ? 'Войти' : 'Зарегистрироваться' }}
      </button>
    </div>
  </form>
</template>

<style lang="scss" scoped src="./Auth.scss" />
