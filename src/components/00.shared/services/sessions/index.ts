import type { RevokeOthersResponse, Session } from './index.type'
import { getAuthToken } from '@/components/00.shared/lib/authToken'

function authConfig() {
  const token = getAuthToken()
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

export const sessionApi = {
  getSessions: () =>
    apiService.get<Session[]>(`/sessions`, authConfig()),

  deleteSession: (sessionId: string) =>
    apiService.delete<void>(`/sessions/${sessionId}`, authConfig()),

  deleteOtherSessions: () =>
    apiService.delete<RevokeOthersResponse>(`/sessions`, authConfig()),
}
