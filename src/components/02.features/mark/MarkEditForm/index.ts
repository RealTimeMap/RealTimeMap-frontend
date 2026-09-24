import type { MarkFull } from '@/components/00.shared/services/mark/index.type'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import MarkEditForm from './ui/index.vue'

export { default } from './ui/index.vue'

export function openMarkEditForm(mark: MarkFull, onSaved?: () => void) {
  const { open } = useDialogStore()
  open(MarkEditForm, { mark, onSaved }, {
    position: 'end center',
    headerModal: false,
  })
}
