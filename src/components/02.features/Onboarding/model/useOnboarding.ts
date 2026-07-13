import { Preferences } from '@capacitor/preferences'
import { useRouter } from 'vue-router'

const STORAGE_KEY = 'rtm_welcome_seen'

export function useOnboarding() {
  const router = useRouter()

  const hasSeenOnboarding = async (): Promise<boolean> => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY })
      return value === 'true'
    }
    catch (e) {
      console.error('[Onboarding Check Error]', e)
      return false
    }
  }

  const completeOnboarding = async (): Promise<void> => {
    try {
      await Preferences.set({
        key: STORAGE_KEY,
        value: 'true',
      })
    }
    catch (e) {
      console.error('[Onboarding Save Error]', e)
    }
    finally {
      await router.push('/')
    }
  }

  return {
    hasSeenOnboarding,
    completeOnboarding,
  }
}
