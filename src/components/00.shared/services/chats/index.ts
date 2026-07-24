import type { Chat, DirectChat, HistoryResponse, Message } from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

export const chatApi = {
  getAllChats: () =>
    apiService.get<Chat[]>(`/chats/`, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),

  postChatDirect: (peerId: number) =>
    apiService.post<DirectChat>(`/chats/direct`, {
      peerId,
    }, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),

  getHistoryChat: (chatId: number, params?: {
    lastMessageId?: number
  }) =>
    apiService.get<HistoryResponse>(`/chats/${chatId}/history`, {
      params,
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),

  postMessage: (chatId: number, payload: {
    content: string
    clientMessageId: string
  }) =>
    apiService.post<Message>(`/chats/${chatId}/messages`, payload, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),

  postReadChat: (chatId: number) =>
    apiService.post<void>(`/chats/${chatId}/read`, {}, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),
}
