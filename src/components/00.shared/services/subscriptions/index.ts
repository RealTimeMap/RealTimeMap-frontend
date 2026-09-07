import type {
  PaginatedResult,
  SubscriptionListParams,
  SubscriptionStatus,
  SubscriptionUser,
} from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

function authHeaders() {
  return {
    Authorization: `Bearer ${getCookie('token')}`,
  }
}

export const subscriptionApi = {
  /** Оформить одностороннюю подписку на профиль */
  subscribe(userId: number): Promise<void> {
    return apiService.post<void>('/subscriptions/subscribe', { userId }, {
      headers: authHeaders(),
    })
  },

  /** Отменить ранее оформленную подписку */
  unsubscribe(userId: number): Promise<void> {
    return apiService.post<void>('/subscriptions/unsubscribe', { userId }, {
      headers: authHeaders(),
    })
  },

  /** Профили, на которые подписан текущий пользователь (исходящие) */
  getSubscriptions(params?: SubscriptionListParams): Promise<PaginatedResult<SubscriptionUser>> {
    return apiService.get<PaginatedResult<SubscriptionUser>>('/subscriptions', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
      headers: authHeaders(),
    })
  },

  /** Профили, подписанные на текущего пользователя (входящие) */
  getSubscribers(params?: SubscriptionListParams): Promise<PaginatedResult<SubscriptionUser>> {
    return apiService.get<PaginatedResult<SubscriptionUser>>('/subscriptions/subscribers', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
      headers: authHeaders(),
    })
  },

  /** Подписан ли текущий пользователь на указанный профиль */
  getStatus(profileId: number): Promise<SubscriptionStatus> {
    return apiService.get<SubscriptionStatus>(`/subscriptions/status/${profileId}`, {
      headers: authHeaders(),
    })
  },
}
