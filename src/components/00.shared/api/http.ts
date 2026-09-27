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
const PROFILE_URL = '/profile/me'

const checks = new Map<string, Promise<boolean>>()

function tokenAlive(token: string): Promise<boolean> {
  let check = checks.get(token)
  if (!check) {
    check = api.get(PROFILE_URL, { headers: { Authorization: `Bearer ${token}` }, _authCheck: true } as never)
      .then(() => true)
      // Сеть или сервер недоступны — не знаем точно, сессию не трогаем
      .catch(error => error?.response?.status !== 401)
    checks.set(token, check)
    void check.finally(() => setTimeout(() => checks.delete(token), 30_000))
  }
  return check
}

api.interceptors.response.use(
  response => response,
  async (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''

    const sent = String(error?.config?.headers?.Authorization ?? '')
    const current = getAuthToken()
    const rejectedCurrent = !!current && sent === `Bearer ${current}`

    if (status === 401 && rejectedCurrent && !AUTH_ENDPOINT_RE.test(url) && !error.config?._authCheck) {
      const rejectedProfile = url.startsWith(PROFILE_URL)
      if (!rejectedProfile && await tokenAlive(current)) {
        console.warn('[auth] 401 при действующем токене — сессию не сбрасываем', url)
        return Promise.reject(error)
      }
      // Пока проверяли, могли войти заново — новый токен не трогаем
      if (getAuthToken() !== current)
        return Promise.reject(error)
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
