import type {
  Message as ChatMessage,
  ChatReadPayload,
  ChatTypingPayload,
  PresenceSnapshotPayload,
  PresenceUserPayload,
  TypingPayload,
} from '@/components/00.shared/services/chats/index.type'
import type {
  Mark,
  MarksOrClusterResponse,
} from '@/components/00.shared/services/mark/index.type'

export interface Message {
  id: string
  text: string
  senderId: string
  timestamp: string
}

export interface MarksRequestPayload {
  // longitude: number
  // latitude: number
  // radius?: number
  // srid?: number
  // date?: string
  // duration?: number | null
  // show_ended?: boolean | null

  screen: {
    leftTop: {
      lat: number
      lon: number
    }
    center: {
      lat: number
      lon: number
    }
    rightBottom: {
      lat: number
      lon: number
    }
  }
  startAt: string
  // endAt: string
  zoomLevel: number
}

// =================================================================
//* СОБЫТИЯ ОТ КЛИЕНТА К СЕРВЕРУ (Client -> Server)
// Описываем, какие события клиент может отправлять.
// Ключ - имя события.
// Значение - функция-обработчик, которая описывает, какие данные (payload) передаются.
// =================================================================

export interface ClientToServerEvents {
  // --- Публичные события (неймспейс /marks) ---
  'message': (
    payload: MarksRequestPayload,
    callback: (response: MarksOrClusterResponse) => void,
  ) => void

  // --- Для получения активных пользователей ---
  'user_count': () => void

  // --- Приватные события (неймспейс /messages) ---
  'message:send': (payload: { text: string }) => void

  /**
   * Троттлинг ~2 сек на клиенте, НЕ на каждое нажатие.
   * Повторный start не создаёт новое chat.typing у собеседников —
   * лишь сдвигает автосброс индикатора (~6 сек после последнего start на сервере).
   */
  'typing.start': (payload: TypingPayload) => void
  /**
   * Необязательно для корректности (индикатор гаснет автосбросом через ~6 сек
   * или при разрыве соединения), но делает UI отзывчивее.
   * Повторный/лишний stop сервером молча игнорируется. Ack отсутствует.
   */
  'typing.stop': (payload: TypingPayload) => void
}

// =================================================================
//* СОБЫТИЯ ОТ СЕРВЕРА К КЛИЕНТУ (Server -> Client)
// Описываем, какие события сервер может присылать клиенту.
// =================================================================

export interface ServerToClientEvents {
  // --- Системные события Socket.IO ---
  'connect': () => void
  'disconnect': (reason: string) => void
  'connect_error': (error: Error) => void

  'user_count': (payload: { count: number | undefined }) => void

  // --- События для меток (неймспейс /marks) ---
  'marksGet': (payload: Mark[]) => void
  'marksCreated': (payload: Mark) => void
  'marks_updated': (payload: Partial<Mark> & { id: string }) => void
  'marks_deleted': (payload: { id: string }) => void

  /**
   * Новое сообщение в любом из чатов пользователя.
   */
  'message.new': (payload: ChatMessage) => void

  'chat.read': (payload: ChatReadPayload) => void

  /** Снимок онлайн-собеседников, приходит один раз при подключении к /chats */
  'presence.snapshot': (payload: PresenceSnapshotPayload) => void
  /** Собеседник появился в сети */
  'presence.online': (payload: PresenceUserPayload) => void
  /** Собеседник ушёл из сети */
  'presence.offline': (payload: PresenceUserPayload) => void
  /** Ретранслируется из typing.start/typing.stop как isTyping true/false */
  'chat.typing': (payload: ChatTypingPayload) => void

  // --- Общие события об ошибках ---
  'error': (payload: { message: string, code?: number }) => void
}
