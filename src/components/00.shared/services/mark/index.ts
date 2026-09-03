import type {
  AllMarksPayload,
  AllMarksResponse,
  Mark,
  MarkAddPayload,
  MarkCategory,
  MarkComment,
  MarkCommentPayload,
  MarkCommentReaction,
  MarkCommentResponse,
  MarkFull,
  MarkLike,
  MarkShare,
  MarkStat,
  RepliesQuery,
} from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

function authConfig() {
  const token = getCookie('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

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

  getCommentReplies: (entityId: number, parentId: number, params?: RepliesQuery) =>
    apiService.get<MarkCommentResponse>(`/${entityId}/comments/${parentId}/replies`, {
      params: { entity: 'mark', ...params },
    }),

  postMarkComment: (payload: MarkCommentPayload) =>
    apiService.post<MarkComment>(`/comments`, payload),

  editComment: (commentId: number, content: string) =>
    apiService.patch<MarkComment>(`/${commentId}/comments`, { content }, authConfig()),

  deleteComment: (commentId: number) =>
    apiService.delete<void>(`/${commentId}/comments`, authConfig()),

  likeComment: (commentId: number) =>
    apiService.post<MarkCommentReaction>(`/${commentId}/comments/reaction`, undefined, authConfig()),

  unlikeComment: (commentId: number) =>
    apiService.delete<MarkCommentReaction>(`/${commentId}/comments/reaction`, authConfig()),

  updateMark: (markId: number, payload: FormData) =>
    apiService.patch<Mark>(`/marks/${markId}`, payload, authConfig()),

  deleteMark: (markId: number) =>
    apiService.delete<void>(`/marks/${markId}`, authConfig()),

  postMarkLike: (id: number) =>
    apiService.post<MarkLike>(`accrual/${id}/like`),

  deleteMarkLike: (id: number) =>
    apiService.delete<MarkLike>(`accrual/${id}/like`),

  postMarkShare: (id: number) =>
    apiService.post<MarkShare>(`accrual/${id}/share`),

  getMarkStat: (id: number) => {
    const token = getCookie('token')
    return apiService.get<MarkStat>(
      `accrual/${id}/stat`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    )
  },

  getAllMarks: ({ userid, ...params }: AllMarksPayload) =>
    apiService.get<AllMarksResponse>(`/marks/${userid}/list`, { params }),
}
