import type { UserSettings } from '@/components/00.shared/services/user/index.type'
import { useDebounceFn } from '@vueuse/core'
import { userApi } from '@/components/00.shared/services/user'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

export function useProfileSettings() {
  const notify = useNotificationStore()
  const showInSearch = ref<boolean>(true)
  const privateProfile = ref<boolean>(false)

  const isSettingsLoaded = ref<boolean>(false)

  let lastSaved: UserSettings = {
    showInSearch: showInSearch.value,
    privateProfile: privateProfile.value,
  }
  let hasLocalEdits = false

  async function loadProfileSettings() {
    try {
      const settings = await userApi.settingsProfile()
      lastSaved = { ...settings }
      if (!hasLocalEdits) {
        showInSearch.value = settings.showInSearch
        privateProfile.value = settings.privateProfile
      }
      isSettingsLoaded.value = true
    }
    catch { }
  }

  async function persist() {
    const snapshot: UserSettings = {
      showInSearch: showInSearch.value,
      privateProfile: privateProfile.value,
    }
    try {
      lastSaved = await userApi.updateSettingsProfile(snapshot)
    }
    catch {
      showInSearch.value = lastSaved.showInSearch
      privateProfile.value = lastSaved.privateProfile
      notify.add({ title: 'Не удалось сохранить настройку', type: 'error' })
    }
  }

  const debouncedPersist = useDebounceFn(persist, 500)

  function setShowInSearch(next: boolean) {
    if (showInSearch.value === next)
      return
    hasLocalEdits = true
    showInSearch.value = next
    debouncedPersist()
  }

  function setPrivateProfile(next: boolean) {
    if (privateProfile.value === next)
      return
    hasLocalEdits = true
    privateProfile.value = next
    debouncedPersist()
  }

  return {
    showInSearch,
    privateProfile,
    isSettingsLoaded,
    loadProfileSettings,
    setShowInSearch,
    setPrivateProfile,
  }
}
