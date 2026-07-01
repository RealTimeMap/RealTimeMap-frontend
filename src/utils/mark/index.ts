import type {
  Mark,
  MarkAddPayload,
  MarkComment,
  MarkCommentPayload,
  MarkCommentResponse,
  MarkCreateResponse,
  MarkFull,
  MyMarkPayload,
  MyMarkResponse,
} from './index.type'
import { getCookie } from '@/shared/lib/cookie'

export const markApi = {
  getMarkFull: (id: number) =>
    apiService.get<MarkFull>(`/marks/${id}`),

  getMarkCreate: () =>
    apiService.get<MarkCreateResponse>('/marks/create-data'),

  postMarkAdd: (payload: MarkAddPayload | FormData) =>
    apiService.post<Mark>('/marks/create', payload, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),

  getMarkComments: (id: number) =>
    apiService.get<MarkCommentResponse>(`/${id}/comments/`, {
      params: { entity: 'mark' },
    }),

  postMarkComment: (payload: MarkCommentPayload) =>
    apiService.post<MarkComment>(`/comments`, payload),

  getMyMark: ({ userid, ...params }: MyMarkPayload) =>
    apiService.get<MyMarkResponse>(`/marks/${userid}/list`, { params }),
}
