import type { EntityId } from '@/components/00.shared/stores/places'
import type { MapPoint } from '@/types/shared/map'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import PersonalMarkForm from './ui/index.vue'

export function openPersonalMarkForm(coords: MapPoint): void {
  useDialogStore().open(PersonalMarkForm, { coords }, {
    position: 'end center',
    headerModal: false,
  })
}

export function openPersonalMarkEditForm(markId: EntityId): void {
  useDialogStore().open(PersonalMarkForm, { markId }, {
    position: 'end center',
    headerModal: false,
  })
}
