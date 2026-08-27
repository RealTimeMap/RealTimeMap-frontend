import type { GetProfileParams, UpdateProfilePayload, User } from './index.type'
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

  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const formData = new FormData()

    if (payload.username !== undefined)
      formData.append('username', payload.username)
    if (payload.tag !== undefined)
      formData.append('tag', payload.tag)
    if (payload.avatar)
      formData.append('avatar', payload.avatar)

    return apiService.patch<User>('/profile/me', formData, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    })
  },
}
