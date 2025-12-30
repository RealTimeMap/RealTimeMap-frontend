// =================================================================
//* МОДЕЛИ ДАННЫХ (Data Models)
// Описываем основные сущности, которые передаются по сокету.
// =================================================================

import type { Mark } from '@/utils/mark/index.type'

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
  endAt: string
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
  'marks_message': (payload: MarksRequestPayload) => void

  // --- Для получения активных пользователей ---
  'user_count': () => void

  // --- Приватные события (неймспейс /messages) ---
  'message:send': (payload: { text: string }) => void
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
  'marks_get': (payload: Mark[]) => void
  'marks_created': (payload: Mark) => void
  'marks_updated': (payload: Partial<Mark> & { id: string }) => void
  'marks_deleted': (payload: { id: string }) => void

  // --- События для сообщений (неймспейс /messages) ---
  'message:new': (payload: Message) => void

  // --- Общие события об ошибках ---
  'error': (payload: { message: string, code?: number }) => void
}
