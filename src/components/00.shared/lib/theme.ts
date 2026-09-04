import { getCookie } from '@/components/00.shared/lib/cookie'

export type ThemeName = 'dark' | 'light' | 'green' | 'ocean' | 'dusk' | 'sky'
export type ThemePreference = ThemeName | 'system'

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

const DEFAULT_PREFERENCE: ThemePreference = 'system'

function isThemeName(value: string | null): value is ThemeName {
  return !!value && THEMES.some(t => t.id === value)
}

export function readSavedPreference(): ThemePreference {
  const saved = getCookie(THEME_COOKIE_NAME)
  if (saved === 'system')
    return 'system'
  return isThemeName(saved) ? saved : DEFAULT_PREFERENCE
}

export function systemBase(): ThemeBase {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function resolvePreference(pref: ThemePreference): ThemeName {
  return pref === 'system' ? systemBase() : pref
}

export function themeMeta(id: ThemeName): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}

export function themeBase(id: ThemeName): ThemeBase {
  return themeMeta(id).base
}

export function preferenceLabel(pref: ThemePreference): string {
  return pref === 'system' ? 'Системная' : themeMeta(pref).label
}

function updateThemeColorMeta(): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-body')
    .trim()
  if (bg)
    meta.setAttribute('content', bg)
}

export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement
  THEMES.forEach(t => root.classList.remove(`theme-${t.id}`))
  root.classList.add(`theme-${theme}`)

  root.style.colorScheme = themeBase(theme)
  updateThemeColorMeta()
}

export function applyThemeInstant(theme: ThemeName): void {
  const root = document.documentElement
  root.classList.add('theme-switching')
  applyTheme(theme)
  void root.offsetWidth
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove('theme-switching'))
  })
}

let mediaListenerAttached = false
let getPreference: () => ThemePreference = readSavedPreference

export function watchSystemTheme(getPref: () => ThemePreference): void {
  getPreference = getPref
  if (mediaListenerAttached || typeof window === 'undefined' || !window.matchMedia)
    return
  mediaListenerAttached = true
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getPreference() === 'system')
      applyThemeInstant(systemBase())
  })
}

export function initTheme(): void {
  applyTheme(resolvePreference(readSavedPreference()))
}
