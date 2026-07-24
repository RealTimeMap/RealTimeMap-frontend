import { useDialogStore } from '@/components/00.shared/stores/dialog'

export function useProfileNavigation() {
  const dialog = useDialogStore()
  const router = useRouter()

  function openProfile(userId: number) {
    dialog.destroy()
    return router.push({ name: 'user-profile', params: { userId } })
  }

  return {
    openProfile,
  }
}
