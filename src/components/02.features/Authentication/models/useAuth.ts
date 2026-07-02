import type { LoginPayload } from '@/components/02.features/Authentication/models/auth'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/components/02.features/Authentication/models/auth'
import { useNotificationStore } from '@/shared/stores/notification'

export function useAuth() {
  const authStore = useAuthStore()
  const notify = useNotificationStore()
  const { t } = useI18n()
  const router = useRouter()

  const isLoading = ref(false)
  const formValue = reactive<LoginPayload>({
    username: '',
    password: '',
  })

  const formErrors = ref<Partial<Record<keyof LoginPayload, string>>>({})

  const isButtonDisabled = computed(() =>
    !formValue.username || !formValue.password || isLoading.value,
  )

  const clearError = (field: keyof LoginPayload): void => {
    if (formErrors.value[field]) {
      formErrors.value[field] = undefined
    }
  }

  const validate = (): boolean => {
    const errors: Partial<Record<keyof LoginPayload, string>> = {}

    if (!formValue.username) {
      errors.username = t('validation.required')
    }
    else if (formValue.username.length < 3) {
      errors.username = t('validation.minLength', { count: 3 })
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
          title: t(`form.${field}.title`),
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
      await authStore.login(formValue)

      notify.add({
        title: 'Успешно!',
        description: 'Добро пожаловать',
        type: 'success',
      })

      await router.push('/profile')
    }
    catch (err: unknown) {
      console.error(err)
      notify.add({
        title: t('notify.errors.unauthorized'),
        type: 'error',
      })

      formErrors.value = {
        username: ' ',
        password: ' ',
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
    isButtonDisabled,
    submit,
    clearError,
    googleAuth: authStore.googleAuth,
  }
}
