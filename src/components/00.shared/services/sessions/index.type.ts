export interface Session {
  /** Идентификатор сессии (uuid) */
  session_id: string
  device_name: string
  user_agent: string
  ip_address: string
  created_at: string
  last_used_at: string
  expires_at: string
  /** true — сессия, из которой пришёл текущий запрос. */
  is_current: boolean
}

export interface RevokeOthersResponse {
  revoked: number
}
