import { defineStore } from 'pinia'
import { useAppearance } from './parts/useAppearance'
import { useCache } from './parts/useCache'
import { useMapCache } from './parts/useMapCache'
import { useNotifications } from './parts/useNotifications'
import { useProfileSettings } from './parts/useProfileSettings'

export const useSettingsStore = defineStore('settings', () => {
  const appearanceSettings = useAppearance()
  const notificationsSettings = useNotifications()
  const cacheSettings = useCache()
  const mapCacheSettings = useMapCache()
  const profileSettings = useProfileSettings()

  return {
    ...appearanceSettings,
    ...notificationsSettings,
    ...cacheSettings,
    ...mapCacheSettings,
    ...profileSettings,
  }
})
