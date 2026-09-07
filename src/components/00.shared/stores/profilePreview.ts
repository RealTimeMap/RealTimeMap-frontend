export interface ProfilePreview {
  userId: number
  username?: string
  avatar?: string
  tag?: string
  isPrivate?: boolean
}

export const useProfilePreviewStore = defineStore('profilePreview', () => {
  const previews = ref(new Map<number, ProfilePreview>())

  function setPreview(preview: ProfilePreview) {
    previews.value.set(preview.userId, preview)
  }

  function getPreview(userId: number): ProfilePreview | undefined {
    return previews.value.get(userId)
  }

  return { previews, setPreview, getPreview }
})
