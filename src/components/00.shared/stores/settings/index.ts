import { defineStore } from 'pinia'
import { useAppearance } from './parts/useAppearance'
import { useCache } from './parts/useCache'
import { useNotifications } from './parts/useNotifications'

export const useSettingsStore = defineStore('settings', () => {
  const appearanceSettings = useAppearance()
  const notificationsSettings = useNotifications()
  const cacheSettings = useCache()

  return {
    ...appearanceSettings,
    ...notificationsSettings,
    ...cacheSettings,
  }
})
