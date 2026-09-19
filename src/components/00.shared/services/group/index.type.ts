export interface CreateGroupPayload {
  name: string
  description?: string
  color?: string
  // Название иконки из iconfy
  icon?: string
}

export interface GetGroupListParams {
  page?: number
  pageSize?: number
}

export interface UpdateGroupPayload {
  name?: string
  description?: string
  color?: string
  icon?: string
}

export interface Group {
  // uuid группы
  id: string
  // Владелец
  userId: number
  name: string
  description?: string
  color?: string
  // Название иконки из iconfy
  icon?: string
  createdAt: string
}

export interface GroupListResponse {
  items: Group[]
  page: number
  pageSize: number
  totalPages: number
  total: number
}
