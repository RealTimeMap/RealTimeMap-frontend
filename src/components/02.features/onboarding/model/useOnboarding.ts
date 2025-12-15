import { useRouter } from 'vue-router'

const STORAGE_KEY = 'rtm_welcome_seen'

export function useOnboarding() {
  const router = useRouter()

  const hasSeenOnboarding = () => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  }

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true')

    router.push('/')
  }

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY)
    location.reload()
  }

  return {
    hasSeenOnboarding,
    completeOnboarding,
    resetOnboarding,
  }
}
