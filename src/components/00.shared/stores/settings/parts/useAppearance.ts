import type { ThemePreference } from '@/components/00.shared/lib/theme'
import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'
import {
  applyThemeInstant,
  readSavedPreference,
  resolvePreference,
  THEME_COOKIE_NAME,
  watchSystemTheme,
} from '@/components/00.shared/lib/theme'

const GLASS_EFFECT_COOKIE_NAME = 'app_glass_effect'

export function useAppearance() {
  // --- STATE ---
  const savedPreference = getCookie(GLASS_EFFECT_COOKIE_NAME)
  const isGlassEffectEnabled = ref<boolean>(savedPreference !== 'false')

  const theme = ref<ThemePreference>(readSavedPreference())
  const resolvedTheme = computed(() => resolvePreference(theme.value))

  // --- ACTIONS ---
  function toggleGlassEffect() {
    isGlassEffectEnabled.value = !isGlassEffectEnabled.value
  }

  function setTheme(next: ThemePreference) {
    theme.value = next
  }

  // --- WATCHERS ---
  watch(isGlassEffectEnabled, (newValue) => {
    setCookie(GLASS_EFFECT_COOKIE_NAME, String(newValue), 365)
    document.documentElement.classList.toggle('no-glass', !newValue)
  }, { immediate: true })

  watch(theme, (newValue) => {
    setCookie(THEME_COOKIE_NAME, newValue, 365)
    applyThemeInstant(resolvePreference(newValue))
  }, { immediate: true })

  watchSystemTheme(() => theme.value)

  return {
    isGlassEffectEnabled,
    toggleGlassEffect,
    theme,
    resolvedTheme,
    setTheme,
  }
}
