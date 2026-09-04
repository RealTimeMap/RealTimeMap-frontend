import { getCookie } from '@/components/00.shared/lib/cookie'
import { syncStatusBar } from '@/components/00.shared/lib/statusBar'

export type ThemeName = 'dark' | 'light' | 'green' | 'ocean' | 'dusk' | 'sky'
export type ThemePreference = ThemeName | 'system'
export type ThemeBase = 'dark' | 'light'

export interface ThemeMeta {
  id: ThemeName
  label: string
  base: ThemeBase
  metaColor: string
}

export const THEMES: ThemeMeta[] = [
  { id: 'dark', label: 'Тёмная', base: 'dark', metaColor: '#121212' },
  { id: 'light', label: 'Светлая', base: 'light', metaColor: '#ffffff' },
  { id: 'green', label: 'Зелёная', base: 'light', metaColor: '#f0fdf4' },
  { id: 'ocean', label: 'Океан', base: 'dark', metaColor: '#0a192f' },
  { id: 'dusk', label: 'Сумерки', base: 'dark', metaColor: '#1e1b2e' },
  { id: 'sky', label: 'Небо', base: 'light', metaColor: '#f0f9ff' },
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
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
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

function updateThemeColorMeta(color: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', color)
}

export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined')
    return

  const root = document.documentElement
  const meta = themeMeta(theme)

  root.dataset.theme = theme
  root.style.colorScheme = meta.base

  updateThemeColorMeta(meta.metaColor)
  syncStatusBar(meta.base, meta.metaColor)
}

export const applyThemeInstant = applyTheme

export function applyThemeAnimated(theme: ThemeName): void {
  if (typeof document === 'undefined')
    return
  const hasOpenModals = Boolean(document.querySelector('.modal-wrapper'))

  if (!hasOpenModals && 'startViewTransition' in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      applyTheme(theme)
    })
  }
  else {
    applyTheme(theme)
  }
}

let mediaListenerAttached = false
let getPreference: () => ThemePreference = readSavedPreference

export function watchSystemTheme(getPref: () => ThemePreference): void {
  getPreference = getPref
  if (mediaListenerAttached || typeof window === 'undefined' || !window.matchMedia)
    return

  mediaListenerAttached = true
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getPreference() === 'system') {
      applyThemeAnimated(systemBase())
    }
  })
}

export function initTheme(): void {
  applyTheme(resolvePreference(readSavedPreference()))
}
