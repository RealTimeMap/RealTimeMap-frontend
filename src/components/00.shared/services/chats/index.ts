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

  getHistoryChat: (chatId: number) =>
    apiService.get<HistoryResponse>(`/chats/${chatId}/history`, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),

  postMessage: (chatId: number, content: string) =>
    apiService.post<Message>(`/chats/${chatId}/messages`, {
      content,
    }, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    }),
}
