import type { ThemeName } from '@/components/00.shared/lib/theme'
import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'
import { applyTheme, readSavedTheme, THEME_COOKIE_NAME } from '@/components/00.shared/lib/theme'

const GLASS_EFFECT_COOKIE_NAME = 'app_glass_effect'

export function useAppearance() {
  // --- STATE ---
  const savedPreference = getCookie(GLASS_EFFECT_COOKIE_NAME)
  const isGlassEffectEnabled = ref<boolean>(savedPreference !== 'false')

  const theme = ref<ThemeName>(readSavedTheme())

  // --- ACTIONS ---
  function toggleGlassEffect() {
    isGlassEffectEnabled.value = !isGlassEffectEnabled.value
  }

  function setTheme(next: ThemeName) {
    theme.value = next
  }

  // --- WATCHERS ---
  watch(isGlassEffectEnabled, (newValue) => {
    setCookie(GLASS_EFFECT_COOKIE_NAME, String(newValue), 365)
  })

  watch(theme, (newValue) => {
    setCookie(THEME_COOKIE_NAME, newValue, 365)
    applyTheme(newValue)
  }, { immediate: true })

  return {
    isGlassEffectEnabled,
    toggleGlassEffect,
    theme,
    setTheme,
  }
}
