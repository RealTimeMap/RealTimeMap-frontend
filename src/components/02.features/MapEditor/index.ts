import { useDialogStore } from '@/components/00.shared/stores/dialog'
import MapEditor from './ui/index.vue'

export { default } from './ui/index.vue'

export function openMapEditor(placement: 'sheet' | 'panel' = 'panel') {
  const { open } = useDialogStore()

  if (placement === 'sheet') {
    open(MapEditor, { preview: false }, {
      position: 'end center',
      headerModal: false,
    })
    return
  }

  open(MapEditor, { preview: true }, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
