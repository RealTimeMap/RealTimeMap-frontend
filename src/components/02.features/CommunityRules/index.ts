import { useDialogStore } from '@/components/00.shared/stores/dialog'
import CommunityRules from './ui/CommunityRules.vue'

export { RULES_VERSION } from './model/rules'

export function openCommunityRules(): void {
  const dialog = useDialogStore()
  dialog.open(CommunityRules, undefined, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
