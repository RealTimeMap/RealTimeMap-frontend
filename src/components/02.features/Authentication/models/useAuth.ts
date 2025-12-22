import type { LoginPayload, RegistrationPayload } from '@/components/02.features/Authentication/model/auth'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const error = ref<string | null>(null)
  const isLoading = ref(false)
  const message = useMessage()

  const submit = async (
    action: 'login' | 'register',
    payload: LoginPayload | RegistrationPayload,
  ) => {
    isLoading.value = true
    error.value = null

    try {
      if (action === 'login') {
        await authStore.login(payload as LoginPayload)
        message.success('Successfully logged in')
      }
      else {
        await authStore.registration(payload as RegistrationPayload)
        message.success('Successfully registered')
      }
    }
    catch (err: any) {
      if (action === 'login')
        message.error('Неправильный логин или пароль')
      else
        message.error('Ошибка регистрации')

      error.value = err.message || 'An error occurred'
      throw err
    }

    finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    submit,
  }
}
