import type { MarkAddPayload } from './index.type'
import { getCookie } from '@/shared/lib/cookie'

export const markApi = {
  postMarkAdd(payload: MarkAddPayload): Promise<MarkAddPayload> {
    return apiService.post<MarkAddPayload>('/marks', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getCookie('token')}`,
      },
    })
  },
}
