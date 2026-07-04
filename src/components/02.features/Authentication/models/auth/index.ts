import type { LoginPayload, RegistrationPayload } from '@/utils/auth/index.type'
import type { User } from '@/utils/user/index.type'
import { Preferences } from '@capacitor/preferences'
import { defineStore } from 'pinia'
import { getCookie, setCookie } from '@/shared/lib/cookie'
import router from '@/shared/lib/router'
import { authApi } from '@/utils/auth'
import { userApi } from '@/utils/user'

const USER_CACHE_KEY = 'map_cached_user'

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const user = ref<User | null>(null)
  const token = ref<string | null>((typeof document !== 'undefined') ? getCookie('token') : null)

  // --- GETTERS ---
  const isAuthenticated = computed(() => !!token.value)

  // --- ACTIONS ---
  const setToken = (newToken: string) => {
    setCookie('token', newToken, 7)
    token.value = newToken
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`
  }

  const getToken = () => {
    if (token.value)
      return token.value
    token.value = localStorage.getItem('token')
    return token.value
  }

  const removeToken = () => {
    setCookie('token', '', -1)
    token.value = null
    delete api.defaults.headers.common.Authorization
  }

  const setUser = async (userData: User | null) => {
    user.value = userData
    if (userData) {
      await Preferences.set({
        key: USER_CACHE_KEY,
        value: JSON.stringify(userData),
      })
    }
  }

  const googleAuth = async () => {
    try {
      const response = await authApi.googleAuth()
      window.location.href = response.authorization_url
    }
    catch (error) {
      console.error('Google Auth Error:', error)
    }
  }
  const logout = async () => {
    try {
      await authApi.logout()
      router.push('/login')
    }
    catch (error) {
      console.error('Logout request failed', error)
    }
    finally {
      await setUser(null)
      removeToken()
      await Preferences.remove({ key: USER_CACHE_KEY })
    }
  }

  const fetchUser = async () => {
    try {
      const userData = await userApi.getProfile({
        include: ['ban', 'gamefication', 'subscription'],
      })
      await setUser(userData)
    }
    catch (error: any) {
      console.error('[Fetch User Error]', error)

      if (error?.code === 'ERR_NETWORK' || !navigator.onLine) {
        return
      }

      // await logout()
      throw error
    }
  }

  const login = async (payload: LoginPayload) => {
    const response = await authApi.login(payload)
    setToken(response.access_token)
    await fetchUser()
  }

  const registration = async (payload: RegistrationPayload) => {
    await authApi.registration(payload)
  }

  const initAuth = async () => {
    const cookieToken = (typeof document !== 'undefined') ? getCookie('token') : null

    if (cookieToken) {
      token.value = cookieToken
      api.defaults.headers.common.Authorization = `Bearer ${cookieToken}`

      try {
        const { value } = await Preferences.get({ key: USER_CACHE_KEY })
        if (value) {
          user.value = JSON.parse(value)
        }
      }
      catch (e) {
        console.error('[Cache Read Error in initAuth]', e)
      }

      await fetchUser()
    }
  }

  return {
    // State
    user,
    token,

    // Getters
    isAuthenticated,

    // Actions
    setToken,
    getToken,
    removeToken,
    setUser,
    googleAuth,
    login,
    registration,
    fetchUser,
    logout,
    initAuth,
  }
})

export type { LoginPayload, RegistrationPayload }
