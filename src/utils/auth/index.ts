import type {
  AuthGoogleResponse,
  AuthResponse,
  LoginPayload,
  RegistrationPayload,
} from './index.type'
import { getCookie } from '@/shared/lib/cookie'

export const authApi = {
  login(payload: LoginPayload): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/login', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },

  googleAuth(): Promise<AuthGoogleResponse> {
    return apiService.get<AuthGoogleResponse>('/auth/google/authorize')
  },

  registration(payload: RegistrationPayload): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', payload)
  },

  logout(): Promise<void> {
    return apiService.post<void>('/auth/logout', null, {
      headers: {
        Authorization: `Bearer ${getCookie('token')}`,
      },
    })
  },
}
