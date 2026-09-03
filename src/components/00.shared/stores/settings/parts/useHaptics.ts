import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

export const HAPTICS_COOKIE_NAME = 'haptics_enabled'

export function useHaptics() {
  const isHapticsEnabled = ref<boolean>(getCookie(HAPTICS_COOKIE_NAME) !== 'false')

  function toggleHaptics() {
    isHapticsEnabled.value = !isHapticsEnabled.value
  }

  watch(isHapticsEnabled, (value) => {
    setCookie(HAPTICS_COOKIE_NAME, String(value), 365)
  })

  return {
    isHapticsEnabled,
    toggleHaptics,
  }
}
