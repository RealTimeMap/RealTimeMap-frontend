import type { ProfilePreview } from '@/components/00.shared/stores/profilePreview'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useProfilePreviewStore } from '@/components/00.shared/stores/profilePreview'

export function useProfileNavigation() {
  const dialog = useDialogStore()
  const preview = useProfilePreviewStore()
  const router = useRouter()

  function openProfile(userId: number, previewData?: Omit<ProfilePreview, 'userId'>) {
    if (previewData)
      preview.setPreview({ userId, ...previewData })

    dialog.destroy()
    return router.push({ name: 'user-profile', params: { userId } })
  }

  return {
    openProfile,
  }
}
