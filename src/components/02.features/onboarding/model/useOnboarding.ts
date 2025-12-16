import { useRouter } from 'vue-router'
import { getCookie, setCookie } from '@/shared/lib/cookie'

const STORAGE_COOKIE_NAME = 'rtm_welcome_seen'

export function useOnboarding() {
  const router = useRouter()

  const hasSeenOnboarding = () => {
    return Boolean(getCookie(STORAGE_COOKIE_NAME)) === true
  }

  const completeOnboarding = () => {
    setCookie(STORAGE_COOKIE_NAME, 'true', 30)

    router.push('/')
  }

  return {
    hasSeenOnboarding,
    completeOnboarding,
  }
}
