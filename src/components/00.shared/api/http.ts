import axios from 'axios'
import { getAuthToken } from '@/components/00.shared/lib/authToken'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const token = getAuthToken()
      if (token)
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

const AUTH_ENDPOINT_RE = /\/auth\/(?:login|register|forgot-password|reset-password|google)/

api.interceptors.response.use(
  response => response,
  async (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''

    const sent = String(error?.config?.headers?.Authorization ?? '')
    const current = getAuthToken()
    const rejectedCurrent = !!current && sent === `Bearer ${current}`

    if (status === 401 && rejectedCurrent && !AUTH_ENDPOINT_RE.test(url)) {
      try {
        const [{ useAuthStore }, { default: router }] = await Promise.all([
          import('@/components/00.shared/stores/auth'),
          import('@/components/00.shared/lib/router'),
        ])
        await useAuthStore().clearSession()
        if (router.currentRoute.value.name !== 'login')
          await router.push('/login')
      }
      catch {
        // редирект/стор недоступны — молча пробрасываем исходную ошибку
      }
    }

    return Promise.reject(error)
  },
)
