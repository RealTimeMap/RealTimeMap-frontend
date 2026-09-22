import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use(
  (config) => {
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

    if (status === 401 && !AUTH_ENDPOINT_RE.test(url)) {
      try {
        const [{ useAuthStore }, { default: router }] = await Promise.all([
          import('@/components/02.features/Authentication/model/auth'),
          import('@/components/00.shared/lib/router'),
        ])
        useAuthStore().removeToken()
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
