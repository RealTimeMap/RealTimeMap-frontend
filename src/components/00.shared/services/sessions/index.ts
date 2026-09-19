import type { RevokeOthersResponse, Session } from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

function authConfig() {
  const token = getCookie('token')
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
