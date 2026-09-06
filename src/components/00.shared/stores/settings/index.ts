import { defineStore } from 'pinia'
import { useAppearance } from './parts/useAppearance'
import { useCache } from './parts/useCache'
import { useHaptics } from './parts/useHaptics'
import { useMapCache } from './parts/useMapCache'
import { useMapControls } from './parts/useMapControls'
import { useNotifications } from './parts/useNotifications'
import { useProfileSettings } from './parts/useProfileSettings'

export const useSettingsStore = defineStore('settings', () => {
  const appearanceSettings = useAppearance()
  const notificationsSettings = useNotifications()
  const hapticsSettings = useHaptics()
  const cacheSettings = useCache()
  const mapCacheSettings = useMapCache()
  const mapControlsSettings = useMapControls()
  const profileSettings = useProfileSettings()

  return {
    ...appearanceSettings,
    ...notificationsSettings,
    ...hapticsSettings,
    ...cacheSettings,
    ...mapCacheSettings,
    ...mapControlsSettings,
    ...profileSettings,
  }
})
