import type { GetProfileParams, User } from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

export const userApi = {
  getProfile(params?: GetProfileParams): Promise<User> {
    const queryParams = new URLSearchParams()

    if (params?.include) {
      params.include.forEach((item) => {
        queryParams.append('include', item)
      })
    }

    return apiService.get<User>('/profile/me', {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
      params: queryParams,
    })
  },

  getProfileById(userId: number, params?: GetProfileParams): Promise<User> {
    const queryParams = new URLSearchParams()
    params?.include?.forEach(item => queryParams.append('include', item))

    return apiService.get<User>(`/profile/${userId}`, {
      params: queryParams,
    })
  },
}
