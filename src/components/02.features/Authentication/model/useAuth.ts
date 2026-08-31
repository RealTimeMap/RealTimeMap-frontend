import type { LoginPayload, RegistrationPayload } from '@/components/02.features/Authentication/model/auth'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const notify = useNotificationStore()
  const { t } = useI18n()
  const router = useRouter()

  const isLoading = ref(false)
  const isRegister = ref(false)
  const isPasswordVisible = ref(false)
  const isConsentGiven = ref(false)

  const formValue = reactive<RegistrationPayload>({
    username: '',
    password: '',
    email: '',
  })

  const formErrors = ref<Partial<Record<keyof RegistrationPayload, string>>>({})

  const isButtonDisabled = computed(() => {
    if (isLoading.value)
      return true
    const baseFields = !formValue.username || !formValue.password
    if (isRegister.value) {
      return baseFields || !formValue.email || !isConsentGiven.value
    }
    return baseFields
  })

  const toggleMode = () => {
    isRegister.value = !isRegister.value
    formErrors.value = {}
    formValue.username = ''
    formValue.password = ''
    formValue.email = ''
    isConsentGiven.value = false
  }

  const clearError = (field: keyof RegistrationPayload): void => {
    if (formErrors.value[field]) {
      formErrors.value[field] = undefined
    }
  }

  const validate = (): boolean => {
    const errors: Partial<Record<keyof RegistrationPayload, string>> = {}

    if (!formValue.username) {
      errors.username = t('validation.required')
    }
    else if (formValue.username.length < 3) {
      errors.username = t('validation.minLength', { count: 3 })
    }

    if (isRegister.value) {
      const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
      if (!formValue.email) {
        errors.email = t('validation.required')
      }
      else if (!emailRegex.test(formValue.email)) {
        errors.email = t('validation.invalidEmail', 'Некорректный формат email')
      }
    }

    if (!formValue.password) {
      errors.password = t('validation.required')
    }
    else if (formValue.password.length < 6) {
      errors.password = t('validation.minLength', { count: 6 })
    }

    formErrors.value = errors

    Object.entries(errors).forEach(([field, message]) => {
      if (message) {
        notify.add({
          title: t(`form.${field}.title`, field.toUpperCase()),
          description: message,
          type: 'warning',
        })
      }
    })

    return Object.keys(errors).length === 0
  }

  const submit = async (): Promise<void> => {
    if (!validate())
      return

    isLoading.value = true

    try {
      if (isRegister.value) {
        const registerData: RegistrationPayload = {
          username: formValue.username,
          password: formValue.password,
          email: formValue.email,
        }
        await authStore.registration(registerData)

        try {
          await authStore.login({
            username: registerData.username,
            password: registerData.password,
          })
        }
        catch (loginErr) {
          console.error('[Auto-Login Failed]', loginErr)
          notify.add({
            title: 'Аккаунт создан',
            description: 'Не удалось войти автоматически. Пожалуйста, войдите вручную.',
            type: 'warning',
          })
          isRegister.value = false
          return
        }

        notify.add({
          title: 'Успешно!',
          description: 'Аккаунт создан. Добро пожаловать!',
          type: 'success',
        })
      }
      else {
        const loginData: LoginPayload = {
          username: formValue.username,
          password: formValue.password,
        }
        await authStore.login(loginData)

        notify.add({
          title: 'Успешно!',
          description: 'Добро пожаловать обратно',
          type: 'success',
        })
      }

      await router.push('/profile')
    }
    catch (err: unknown) {
      console.error(err)
      notify.add({
        title: isRegister.value ? 'Ошибка регистрации' : t('notify.errors.unauthorized'),
        type: 'error',
      })

      formErrors.value = {
        username: ' ',
        password: ' ',
        ...(isRegister.value && { email: ' ' }),
      }
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    formValue,
    formErrors,
    isLoading,
    isRegister,
    isButtonDisabled,
    isPasswordVisible,
    isConsentGiven,
    toggleMode,
    submit,
    clearError,
    googleAuth: authStore.googleAuth,
  }
}
