import { useDialogStore } from '@/components/00.shared/stores/dialog'
import ActiveSessions from './ui/index.vue'

export function openActiveSessions(): void {
  useDialogStore().open(ActiveSessions, undefined, {
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
