export interface SubscriptionUser {
  userId: number
  username: string
  tag?: string
  avatar?: string
  isPrivate: boolean
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalPages: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

export interface SubscriptionListParams {
  page?: number
  pageSize?: number
}

export interface SubscriptionStatus {
  subscribed: boolean
}
