import { useDialogStore } from '@/components/00.shared/stores/dialog'
import ThemePicker from './ui/index.vue'

export function openThemePicker(): void {
  const dialog = useDialogStore()
  dialog.open(ThemePicker, undefined, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
