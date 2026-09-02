import type { BugCreatePayload } from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

export const bugApi = {
  create: (payload: BugCreatePayload) => {
    const token = getCookie('token')
    return apiService.post<Record<string, never>>(
      '/bug/create',
      payload,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    )
  },
}
