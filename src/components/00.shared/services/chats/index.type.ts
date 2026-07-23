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

export interface Message {
  id: number
  type: string
  content: string
  /** Время отправки (ISO 8601) */
  createdAt: string
  chatId: number
  sender: {
    id: number
    username: string
    avatar?: string
  }
}
