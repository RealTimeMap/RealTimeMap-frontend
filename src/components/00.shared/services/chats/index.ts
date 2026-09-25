import type { Chat, DirectChat, HistoryResponse, Message } from './index.type'
import { getAuthToken } from '@/components/00.shared/lib/authToken'

export const chatApi = {
  getAllChats: () =>
    apiService.get<Chat[]>(`/chats/`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),

  postChatDirect: (peerId: number) =>
    apiService.post<DirectChat>(`/chats/direct`, {
      peerId,
    }, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),

  getHistoryChat: (chatId: number, params?: {
    lastMessageId?: number
  }) =>
    apiService.get<HistoryResponse>(`/chats/${chatId}/history`, {
      params,
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),

  postMessage: (chatId: number, payload: {
    content: string
    clientMessageId: string
  }) =>
    apiService.post<Message>(`/chats/${chatId}/messages`, payload, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),

  postReadChat: (chatId: number) =>
    apiService.post<void>(`/chats/${chatId}/read`, {}, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
}
