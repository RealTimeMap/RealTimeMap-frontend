import type { BugCreatePayload } from './index.type'
import { getAuthToken } from '@/components/00.shared/lib/authToken'

export const bugApi = {
  create: (payload: BugCreatePayload) => {
    const token = getAuthToken()
    return apiService.post<Record<string, never>>(
      '/bug/create',
      payload,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    )
  },
}
