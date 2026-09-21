export interface TokenPayload {
  token: string
  deviceId: string
  platform: string
}

export type NotificationType = 'chat' | 'comment' | 'subscriber'

export type Muted = Record<NotificationType, boolean>

export interface TokenPayloadPatch {
  deviceId: string
  muted: Partial<Muted>
}

export interface TokenResponsePatch {
  deviceId: string
  enabled: boolean
  muted: Muted
}
