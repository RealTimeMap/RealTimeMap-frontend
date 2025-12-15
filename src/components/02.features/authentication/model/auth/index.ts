import type { LoginPayload, RegistrationPayload } from '@/utils/auth/index.type'
import type { User } from '@/utils/user/index.type'
import { defineStore } from 'pinia'
import { getCookie, setCookie } from '@/shared/lib/cookie'
import { authApi } from '@/utils/auth'
import { userApi } from '@/utils/user'

interface AuthState {
  user: User | null
  token: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: (typeof document !== 'undefined') ? getCookie('token') : null,
  }),

  getters: {
    isAuthenticated: state => !!state.token,
  },

  actions: {
    setToken(token: string) {
      setCookie('token', token, 7)
      this.token = token
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    },
    getToken() {
      if (this.token)
        return this.token
      this.token = localStorage.getItem('token')
      return this.token
    },
    removeToken() {
      setCookie('token', '', -1)
      this.token = null
      delete api.defaults.headers.common.Authorization
    },

    setUser(userData: User | null) {
      this.user = userData
    },

    async googleAuth() {
      try {
        const response = await authApi.googleAuth()
        window.location.href = response.authorization_url
      }
      catch (error) {
        console.error('Google Auth Error:', error)
      }
    },

    async login(payload: LoginPayload) {
      const response = await authApi.login(payload)
      this.setToken(response.access_token)
      await this.fetchUser()
    },

    async registration(payload: RegistrationPayload) {
      await authApi.registration(payload)
    },

    async fetchUser() {
      try {
        const user = await userApi.getProfile({
          include: ['ban', 'gamefication', 'subscription'],
        })
        this.setUser(user)
      }
      catch (error) {
        this.logout()
        throw error
      }
    },

    async logout() {
      try {
        await authApi.logout()
      }
      catch (error) {
        console.error('Logout request failed', error)
      }
      finally {
        this.setUser(null)
        this.removeToken()
      }
    },

    initAuth() {
      const cookieToken = (typeof document !== 'undefined') ? getCookie('token') : null
      if (cookieToken) {
        this.token = cookieToken
        api.defaults.headers.common.Authorization = `Bearer ${cookieToken}`
        this.fetchUser()
      }
    },
  },
})

export type { LoginPayload, RegistrationPayload }
