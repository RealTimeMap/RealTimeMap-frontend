import type {
  MarkAddPayload,
  MarkAddResponse,
  MarkComment,
  MarkCommentPayload,
  MarkCommentResponse,
  MarkCreateResponse,
  MarkFull,
} from './index.type'
import { getCookie } from '@/shared/lib/cookie'

export const markApi = {
  getMarkFull(markId: number): Promise<MarkFull> {
    return apiService.get<MarkFull>(`/marks/${markId}`)
  },

  getMarkCreate(): Promise<MarkCreateResponse> {
    return apiService.get<MarkCreateResponse>('/marks/create-data')
  },

  postMarkAdd(payload: MarkAddPayload): Promise<MarkAddResponse> {
    return apiService.post<MarkAddResponse>('/marks', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getCookie('token')}`,
      },
    })
  },

  getMarkComments(markId: number): Promise<MarkCommentResponse> {
    return apiService.get<MarkCommentResponse>(`/marks/${markId}/comments`)
  },

  postMarkComment(markId: number, payload: MarkCommentPayload): Promise<MarkComment> {
    return apiService.post<MarkComment>(`/marks/${markId}/comments`, payload)
  },
}
