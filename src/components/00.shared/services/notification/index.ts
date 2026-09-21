import type { TokenPayload, TokenPayloadPatch, TokenResponsePatch } from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

function authConfig() {
  const token = getCookie('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

export const notificationApi = {
  postToken(payload: TokenPayload) {
    return apiService.post<void>('/tokens', payload, authConfig())
  },

  patchTokens(payload: TokenPayloadPatch) {
    return apiService.patch<TokenResponsePatch>('/tokens/me', payload, authConfig())
  },
}
