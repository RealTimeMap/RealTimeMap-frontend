import type {
  GetProfileParams,
  SearchProfilesParams,
  SearchProfilesResponse,
  UpdateProfilePayload,
  UpdateUserSettings,
  User,
  UserSettings,
} from './index.type'
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

  settingsProfile() {
    return apiService.get<UserSettings>(`/profile/settings`, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    })
  },

  updateSettingsProfile(payload: UpdateUserSettings) {
    return apiService.patch<UserSettings>(`/profile/settings`, payload, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    })
  },

  searchProfiles(params: SearchProfilesParams): Promise<SearchProfilesResponse> {
    const queryParams = new URLSearchParams()

    if (params.q)
      queryParams.append('q', params.q)
    queryParams.append('page', String(params.page ?? 1))
    queryParams.append('pageSize', String(params.pageSize ?? 10))

    return apiService.get<SearchProfilesResponse>('/profile/search', {
      params: queryParams,
    })
  },
}
