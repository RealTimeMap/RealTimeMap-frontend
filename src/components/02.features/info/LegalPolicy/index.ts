import { useDialogStore } from '@/components/00.shared/stores/dialog'
import PrivacyPolicy from './ui/PrivacyPolicy.vue'

export { OPERATOR, POLICY_VERSION } from './model/policy'

export function openPrivacyPolicy(): void {
  const dialog = useDialogStore()
  dialog.open(PrivacyPolicy, undefined, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
