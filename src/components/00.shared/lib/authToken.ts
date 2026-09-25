import { getCookie, setCookie } from './cookie'

const COOKIE_NAME = 'token'
const STORAGE_KEY = 'rtm_auth_token'
const COOKIE_DAYS = 7

export function getAuthToken(): string | null {
  if (typeof document === 'undefined')
    return null
  const fromCookie = getCookie(COOKIE_NAME)
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (fromCookie) {
      if (stored !== fromCookie)
        localStorage.setItem(STORAGE_KEY, fromCookie)
      return fromCookie
    }
    if (stored) {
      setCookie(COOKIE_NAME, stored, COOKIE_DAYS)
      return stored
    }
  }
  catch { }
  return fromCookie
}

export function setAuthToken(token: string) {
  setCookie(COOKIE_NAME, token, COOKIE_DAYS)
  try {
    localStorage.setItem(STORAGE_KEY, token)
  }
  catch { }
}

export function removeAuthToken() {
  setCookie(COOKIE_NAME, '', -1)
  try {
    localStorage.removeItem(STORAGE_KEY)
  }
  catch { }
}
