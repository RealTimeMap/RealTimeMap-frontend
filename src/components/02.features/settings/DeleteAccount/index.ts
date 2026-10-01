import { useDialogStore } from '@/components/00.shared/stores/dialog'
import DeleteAccount from './ui/index.vue'

export function openDeleteAccount(): void {
  useDialogStore().open(DeleteAccount, undefined, { position: 'end center', headerModal: false })
}

export { default } from './ui/index.vue'
