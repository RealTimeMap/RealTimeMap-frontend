interface LastMessage {
  /** ID последнего сообщения */
  messageId: number
  /** Имя автора последнего сообщения */
  username: string
  /** Текст последнего сообщения */
  content: string
}

export interface Chat {
  /** ID чата */
  chatId: number
  /** Тип чата */
  type: string
  /** Заголовок: для direct — username собеседника, для group — название чата */
  title: string
  /** Аватар: для direct — аватар собеседника, для group — пустой (пока не реализован) */
  avatar?: string
  /** Превью последнего сообщения. null, если сообщений ещё нет */
  lastMessage?: LastMessage
  /** Количество непрочитанных сообщений */
  unreadCount: number
  /** Время последнего обновления чата (ISO 8601) */
  updatedAt: string

  peerId: number
}

export interface DirectChat {
  /** ID чата */
  chatId: number
  /** Профиль собеседника */
  peer: {
    id: number
    username: string
    avatar?: string
  }
  /** Время создания чата (ISO 8601) */
  createdAt: string
}

export interface HistoryResponse {
  messages: Message[]
  lastMessageId: number
}

export interface ChatReadPayload {
  chatId: number
  userId: number
  lastReadMessageId: number
}

export interface Message {
  id: number
  type: string
  content: string
  /** Ключ идемпотентности от клиента. У сообщений из старой истории отсутствует */
  clientMessageId?: string
  /** Время отправки (ISO 8601) */
  createdAt: string
  chatId: number
  sender: {
    id: number
    username: string
    avatar?: string
  }
}

export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface ChatMessage extends Message {
  status?: MessageStatus
}

export interface TypingPayload {
  chatId: number
}

export interface ChatTypingPayload {
  chatId: number
  userId: number
  username?: string
  isTyping: boolean
}

export interface PresenceUserPayload {
  userId: number
  at: string
}

export interface PresenceSnapshotEntry {
  userId: number
  online: boolean
  at: string
}

export interface PresenceSnapshotPayload {
  online: number[]
}
