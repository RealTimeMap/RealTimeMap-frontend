import { getCookie, setCookie } from '@/shared/lib/cookie'

const GLASS_EFFECT_COOKIE_NAME = 'app_glass_effect'

export function useAppearance() {
  // --- STATE ---
  const savedPreference = getCookie(GLASS_EFFECT_COOKIE_NAME)
  const isGlassEffectEnabled = ref<boolean>(savedPreference !== 'false')

  // --- ACTIONS ---
  function toggleGlassEffect() {
    isGlassEffectEnabled.value = !isGlassEffectEnabled.value
  }

  // --- WATCHERS ---
  watch(isGlassEffectEnabled, (newValue) => {
    setCookie(GLASS_EFFECT_COOKIE_NAME, String(newValue), 365)
  })

  return {
    isGlassEffectEnabled,
    toggleGlassEffect,
  }
}
