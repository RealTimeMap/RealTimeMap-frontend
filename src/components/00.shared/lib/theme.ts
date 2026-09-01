import { getCookie } from '@/components/00.shared/lib/cookie'

export type ThemeName = 'dark' | 'light' | 'green' | 'ocean' | 'dusk' | 'sky'

export type ThemeBase = 'dark' | 'light'

export interface ThemeMeta {
  id: ThemeName
  label: string
  base: ThemeBase
}

export const THEMES: ThemeMeta[] = [
  { id: 'dark', label: 'Тёмная', base: 'dark' },
  { id: 'light', label: 'Светлая', base: 'light' },
  { id: 'green', label: 'Зелёная', base: 'light' },
  { id: 'ocean', label: 'Океан', base: 'dark' },
  { id: 'dusk', label: 'Сумерки', base: 'dark' },
  { id: 'sky', label: 'Небо', base: 'light' },
]

export const THEME_COOKIE_NAME = 'app_theme'

const DEFAULT_THEME: ThemeName = 'dark'

export function readSavedTheme(): ThemeName {
  const saved = getCookie(THEME_COOKIE_NAME)
  return THEMES.some(t => t.id === saved) ? (saved as ThemeName) : DEFAULT_THEME
}

export function themeMeta(id: ThemeName): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}

export function themeBase(id: ThemeName): ThemeBase {
  return themeMeta(id).base
}

export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement
  THEMES.forEach(t => root.classList.remove(`theme-${t.id}`))
  root.classList.add(`theme-${theme}`)
}

export function initTheme(): void {
  applyTheme(readSavedTheme())
}
