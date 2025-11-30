import type {
  MarkAddPayload,
  MarkAddResponse,
  MarkFull,
} from './index.type'
import { getCookie } from '@/shared/lib/cookie'

export const markApi = {
  getMarkFull(markId: number): Promise<MarkFull> {
    return apiService.get<MarkFull>(`/marks/${markId}`)
  },

  postMarkAdd(payload: MarkAddPayload): Promise<MarkAddResponse> {
    return apiService.post<MarkAddResponse>('/marks', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getCookie('token')}`,
      },
    })
  },
}
