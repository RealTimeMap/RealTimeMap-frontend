import type {
  AllMarksPayload,
  AllMarksResponse,
  Mark,
  MarkAddPayload,
  MarkCategory,
  MarkComment,
  MarkCommentPayload,
  MarkCommentResponse,
  MarkFull,
  MarkLike,
  MarkShare,
} from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

export const markApi = {
  getMarkFull: (id: number) =>
    apiService.get<MarkFull>(`/marks/${id}`),

  getMarkCreate: () =>
    apiService.get<MarkCategory[]>('/category/all'),

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

  postMarkLike: (id: number) =>
    apiService.post<MarkLike>(`accrual/${id}/like`),

  deleteMarkLike: (id: number) =>
    apiService.delete<MarkLike>(`accrual/${id}/like`),

  postMarkShare: (id: number) =>
    apiService.post<MarkShare>(`accrual/${id}/share`),

  getAllMarks: ({ userid, ...params }: AllMarksPayload) =>
    apiService.get<AllMarksResponse>(`/marks/${userid}/list`, { params }),
}
