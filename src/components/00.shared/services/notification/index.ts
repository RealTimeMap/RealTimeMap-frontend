import type { TokenPayload, TokenPayloadPatch, TokenResponsePatch } from './index.type'
import { getAuthToken } from '@/components/00.shared/lib/authToken'

function authConfig() {
  const token = getAuthToken()
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
