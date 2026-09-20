import type { EntityId } from '@/components/00.shared/stores/places'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import GroupDetail from './ui/GroupDetail.vue'
import GroupForm from './ui/GroupForm.vue'

export function openGroupForm(
  group?: { id: EntityId, name: string, description?: string, color?: string, icon?: string },
): void {
  useDialogStore().open(
    GroupForm,
    group
      ? {
          groupId: group.id,
          initialName: group.name,
          initialDescription: group.description,
          initialColor: group.color,
          initialIcon: group.icon,
        }
      : undefined,
    {
      transition: 'slide-up',
      headerModal: false,
      position: 'end center',
      closeOnOverlayClick: true,
    },
  )
}

export function openGroupDetail(groupId: EntityId, options?: { readonly?: boolean }): void {
  useDialogStore().open(GroupDetail, { groupId, readonly: options?.readonly ?? false }, {
    position: 'end center',
    headerModal: false,
  })
}
