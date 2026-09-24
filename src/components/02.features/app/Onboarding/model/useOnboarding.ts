import { useRouter } from 'vue-router'
import { hasSeenOnboarding, markOnboardingSeen } from '@/components/00.shared/lib/onboardingFlag'

export function useOnboarding() {
  const router = useRouter()

  const completeOnboarding = async (): Promise<void> => {
    try {
      await markOnboardingSeen()
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
