import { defineStore } from 'pinia'
import { useAppearance } from './settings-parts/useAppearance'
import { useLanguage } from './settings-parts/useLanguage'
import { useTheme } from './settings-parts/useTheme'

export const useSettingsStore = defineStore('settings', () => {
  const themeSettings = useTheme()
  const languageSettings = useLanguage()
  const appearanceSettings = useAppearance()

  return {
    ...themeSettings,
    ...languageSettings,
    ...appearanceSettings,
  }
})
