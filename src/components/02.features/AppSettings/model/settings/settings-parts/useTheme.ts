import { getCookie, setCookie } from '@/shared/lib/cookie'

export type ThemeName = 'light' | 'dark'
const THEME_COOKIE_NAME = 'app_theme'

export function useTheme() {
  const savedTheme = getCookie(THEME_COOKIE_NAME)
  const initialTheme: ThemeName
    = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'

  const currentTheme = ref<ThemeName>(initialTheme)

  const customThemeVars = computed(() => {
    if (currentTheme.value === 'dark') {
      return {
        '--primary-color': '#7aafeb',
        '--red-color': '#FF5A5F',
        '--access-color': '#82f00d',
        '--text-color': '#e9ecef',
        '--bg-color-soft': 'rgba(0, 0, 0, 0.55)',
        '--u-modal-wrapper-bg': 'rgba(18, 24, 38, 0.45)',
        '--bg-color-block': 'rgba(18, 24, 38, 0.45)',

        '--border-radius-md': '20px',

        '--glass-background': 'rgba(40, 40, 40, 0.6)',
        '--glass-border': 'rgba(255, 255, 255, 0.1)',
        '--glass-tint': 'rgba(0, 0, 0, 0.2)',
        '--glass-shine': 'rgba(255, 255, 255, 0.1)',

        '--orb-background': 'var(--primary-color)',
        '--nav-icon-inactive': 'rgba(255, 255, 255, 0.6)',
        '--nav-icon-active': 'var(--primary-color)',
      }
    }
    return {
      '--primary-color': '#7aafeb',
      '--red-color': '#FF5A5F',
      '--access-color': '#82f00d',
      '--text-color': '#343a40',
      '--bg-color-soft': 'rgba(255, 255, 255, 0.55)',
      '--u-modal-wrapper-bg': 'rgba(255, 255, 255, 0.92)',

      '--glass-background': 'rgba(255, 255, 255, 0.25)',
      '--glass-border': 'rgba(255, 255, 255, 0.18)',
      '--glass-tint': 'rgba(255, 255, 255, 0.25)',
      '--glass-shine': 'rgba(255, 255, 255, 0.5)',

      '--orb-background': 'var(--primary-color)',
      '--nav-icon-inactive': '#555555',
      '--nav-icon-active': 'var(--primary-color)',
    }
  })

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  watch(currentTheme, (newTheme) => {
    setCookie(THEME_COOKIE_NAME, newTheme, 365)
  })

  return {
    toggleTheme,
    currentTheme,
    customThemeVars,
  }
}
