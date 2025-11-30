import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import { getCookie, setCookie } from '@/shared/lib/cookie'

export type ThemeName = 'light' | 'dark'
const THEME_COOKIE_NAME = 'app_theme'

export function useTheme() {
  const savedTheme = getCookie(THEME_COOKIE_NAME)
  const initialTheme: ThemeName
    = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
  const currentTheme = ref<ThemeName>(initialTheme)
  const theme = computed(() => {
    return currentTheme.value === 'dark' ? darkTheme : null
  })

  const themeOverrides = computed<GlobalThemeOverrides>(() => {
    return {
      common: {
        primaryColor: '#4A90E2',
        primaryColorHover: '#357ABD',
        primaryColorPressed: '#2A629A',
        primaryColorSuppl: '#4A90E2',
      },
      Button: {
        textColorPrimary: '#FFFFFF',
      },
    }
  })

  const customThemeVars = computed(() => {
    if (currentTheme.value === 'dark') {
      return {
        '--primary-color': '#4A90E2',
        '--red-color': '#FF5A5F',
        '--access-color': '#00C851',
        '--text-color': '#fff',
        '--bg-color-soft': 'rgba(0, 0, 0, 0.55)',

        '--glass-background': 'rgba(40, 40, 40, 0.6)',
        '--glass-border': 'rgba(255, 255, 255, 0.1)',
        '--glass-tint': 'rgba(0, 0, 0, 0.2)',
        '--glass-shine': 'rgba(255, 255, 255, 0.1)',

        '--orb-background': 'rgba(255, 255, 255, 0.9)',
        '--nav-icon-inactive': 'rgba(255, 255, 255, 0.6)',
        '--nav-icon-active': '#000000',
      }
    }
    return {
      '--primary-color': '#4A90E2',
      '--red-color': '#FF5A5F',
      '--access-color': '#00C851',
      '--text-color': '#000',
      '--bg-color-soft': 'rgba(255, 255, 255, 0.55)',

      '--glass-background': 'rgba(255, 255, 255, 0.25)',
      '--glass-border': 'rgba(255, 255, 255, 0.18)',
      '--glass-tint': 'rgba(255, 255, 255, 0.25)',
      '--glass-shine': 'rgba(255, 255, 255, 0.5)',

      '--orb-background': '#ffffff',
      '--nav-icon-inactive': '#555555',
      '--nav-icon-active': '#000000',
    }
  })

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  watch(currentTheme, (newTheme) => {
    setCookie(THEME_COOKIE_NAME, newTheme, 365)
  })

  return {
    theme,
    themeOverrides,
    toggleTheme,
    currentTheme,
    customThemeVars,
  }
}
