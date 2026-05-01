<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../models/auth'

const auth = useAuthStore()

interface LoginForm {
  username: string
  password: string
}
type FormErrors = Partial<Record<keyof LoginForm, string>>

const { t } = useI18n()

const formValue = reactive<LoginForm>({
  username: '',
  password: '',
})
const formErrors = ref<FormErrors>({})
const isLoading = ref(false)
const router = useRouter()

function clearError(field: keyof LoginForm) {
  if (formErrors.value[field]) {
    formErrors.value[field] = undefined
  }
}

function validate(): boolean {
  const errors: FormErrors = {}

  if (!formValue.username) {
    errors.username = t('validation.required')
  }
  else if (formValue.username.length < 3) {
    errors.username = t('validation.min_3')
  }

  if (!formValue.password) {
    errors.password = t('validation.required')
  }
  else if (formValue.password.length < 6) {
    errors.password = t('validation.min_6')
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

async function handleValidateClick() {
  if (!validate())
    return

  isLoading.value = true
  try {
    await auth.login({ ...formValue })
    router.push('/profile')
  }
  catch (error: any) {
    formErrors.value.username = error.message || 'Ошибка авторизации'
  }
  finally {
    isLoading.value = false
  }
}

function disableButton() {
  return formValue.username === '' || formValue.password === ''
}
</script>

<template>
  <div class="auth-form">
    <div class="auth-form__body">
      <u-input
        v-model="formValue.username"
        label=""
        :placeholder="t('form.username.title')"
        :disabled="isLoading"
        :loading="isLoading"
        :error="!!formErrors.username"
        type="text"
        @input="clearError('username')"
      />

      <u-input
        v-model="formValue.password"
        label=""
        :placeholder="t('form.password.title')"
        :loading="isLoading"
        :disabled="isLoading"
        :error="!!formErrors.password"
        type="password"
        @input="clearError('password')"
      />
    </div>

    <button class="button__link">
      Забыли пароль?
    </button>

    <button
      class="button primary"
      :class="{ disable: disableButton() }"
      :disabled="disableButton()"
      :loading="isLoading"
      @click="handleValidateClick"
    >
      Войти
    </button>

    <u-drawer text="или" />

    <div class="auth-form__social">
      <button
        class="button__social"
        @click="auth.googleAuth()"
      >
        <u-icon
          icon="uil:google"
          width="16"
          height="16"
        />
        Google
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  width: 90%;
  max-width: 400px;

  &__body {
    border-radius: 22px;
    overflow: hidden;
    backdrop-filter: blur(41.28px) saturate(180%);
    background: rgba(18, 24, 38, 0.43);
    border: 0.5px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      rgba(255, 255, 255, 0.06) 0px 1px 0px inset,
      rgba(0, 0, 0, 0.35) 0px 10px 30px;
    padding: 6px 14px;

    :deep(.u-input) {
      padding: 14px 2px;
    }
  }

  .button__link {
    width: max-content;
    margin-left: auto;
    background: none;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
