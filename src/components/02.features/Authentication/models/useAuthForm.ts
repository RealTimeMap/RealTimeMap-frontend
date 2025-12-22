import type { FormInst, FormRules } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAuth } from './useAuth'

export type AuthMode = 'login' | 'register'

interface AuthFormErrors {
  username?: string
  email?: string
  password?: string
  repeatPassword?: string
  general?: string
}

export function useAuthForm() {
  const { t } = useI18n()
  const { submit, isLoading } = useAuth()

  const formRef = ref<FormInst | null>(null)

  const authMode = ref<AuthMode>('login')

  const formValue = ref({
    username: '',
    email: '',
    password: '',
    repeatPassword: '',
  })

  const formErrors = ref<AuthFormErrors>({})

  const rules = computed<FormRules>(() => {
    const baseRules = {
      username: {
        required: true,
        message: t('form.username.error'),
        trigger: ['input', 'blur'],
      },
      password: {
        required: true,
        message: t('form.password.error'),
        trigger: ['input', 'blur'],
      },
    }

    if (authMode.value === 'register') {
      return {
        ...baseRules,
        email: {
          required: true,
          trigger: ['input', 'blur'],
          validator: (_rule, value) => {
            if (!value) {
              return new Error(t('form.email.required'))
            }
            const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              return new Error(t('form.email.invalid'))
            }
            return true
          },
        },
        repeatPassword: {
          required: true,
          trigger: ['input', 'blur'],
          validator: (_rule, value) => {
            if (!value) {
              return new Error(t('form.repeatPassword.error'))
            }
            if (value !== formValue.value.password) {
              return new Error(t('form.repeatPassword.mismatchError'))
            }
            return true
          },
        },
      }
    }

    return baseRules
  })

  const submitButtonText = computed(() =>
    authMode.value === 'login' ? t('buttons.login') : t('buttons.createAccount'),
  )

  const clearErrors = (field?: keyof AuthFormErrors) => {
    if (field) {
      delete formErrors.value[field]
    }
    else {
      formErrors.value = {}
    }
  }

  const setBackendErrors = (errors: AuthFormErrors) => {
    formErrors.value = { ...formErrors.value, ...errors }
  }

  const handleBackendError = (error: any) => {
    if (!error) {
      formErrors.value.general = t('errors.unknown')
      return
    }

    if (error.response?.data) {
      const errorData = error.response.data

      if (typeof errorData === 'object') {
        const backendErrors: AuthFormErrors = {}

        Object.keys(errorData).forEach((key) => {
          if (key === 'username' || key === 'email' || key === 'password') {
            backendErrors[key] = errorData[key]
          }
          else if (key === 'message' || key === 'detail') {
            backendErrors.general = errorData[key]
          }
        })

        setBackendErrors(backendErrors)
      }
      else if (typeof errorData === 'string') {
        formErrors.value.general = errorData
      }
    }
    else if (error.message) {
      if (error.message.includes('Network Error') || error.message.includes('timeout')) {
        formErrors.value.general = t('errors.network')
      }
      else {
        formErrors.value.general = error.message
      }
    }
    else {
      formErrors.value.general = t('errors.unknown')
    }

    nextTick(() => {
      const firstErrorElement = document.querySelector('.has-error')
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  watch([() => formValue.value.username, () => formValue.value.email, () => formValue.value.password], () => {
    clearErrors('general')
  })

  const handleTabChange = (value: string) => {
    authMode.value = value as AuthMode
    formValue.value = {
      username: '',
      email: '',
      password: '',
      repeatPassword: '',
    }
    formErrors.value = {}
    formRef.value?.restoreValidation()
  }

  const handleValidateClick = (e: MouseEvent) => {
    e.preventDefault()
    clearErrors()

    formRef.value?.validate((errors) => {
      if (!errors) {
        const payload = {
          username: formValue.value.username,
          password: formValue.value.password,
          ...(authMode.value === 'register' ? { email: formValue.value.email } : {}),
        }

        submit(authMode.value, payload)
          .catch((error) => {
            handleBackendError(error)
          })
      }
      else {
        console.error(errors)
      }
    })
  }

  return {
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
  }
}
