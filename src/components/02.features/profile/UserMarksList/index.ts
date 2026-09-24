import { useDialogStore } from '@/components/00.shared/stores/dialog'
import UserMarksList from './ui/index.vue'

export function openUserMarks(userId: number): void {
  const dialog = useDialogStore()
  dialog.open(UserMarksList, { userId }, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}

export { default } from './ui/index.vue'
