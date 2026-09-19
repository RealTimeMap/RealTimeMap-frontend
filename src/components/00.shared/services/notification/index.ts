import type { TokenPayload } from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

function authConfig() {
  const token = getCookie('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

export const notificationApi = {
  postToken(payload: TokenPayload) {
    apiService.post('/tokens', payload, authConfig())
  },
}
