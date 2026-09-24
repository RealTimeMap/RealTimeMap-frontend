import { useDialogStore } from '@/components/00.shared/stores/dialog'
import AchievementsList from './ui/index.vue'

export function openAchievements(userId: number): void {
  const dialog = useDialogStore()
  dialog.open(AchievementsList, { userId }, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
