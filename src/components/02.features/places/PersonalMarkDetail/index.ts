import type { EntityId } from '@/components/00.shared/stores/places'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import PersonalMarkDetail from './ui/index.vue'

export function openPersonalMarkDetail(markId: EntityId): void {
  useDialogStore().open(PersonalMarkDetail, { markId }, {
    position: 'end center',
    headerModal: false,
  })
}
