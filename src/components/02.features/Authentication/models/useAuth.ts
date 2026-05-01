import type {
  LoginPayload,
} from '@/components/02.features/Authentication/models/auth'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/components/02.features/Authentication/models/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const error = ref<string | null>(null)
  const isLoading = ref(false)
  const message = useMessage()

  const submit = async (
    payload: LoginPayload,
  ) => {
    isLoading.value = true
    error.value = null

    try {
      await authStore.login(payload as LoginPayload)
      message.success('Successfully logged in')
    }
    catch (err: any) {
      message.error('Неправильный логин или пароль')
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
