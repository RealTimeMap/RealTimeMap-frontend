import { useDialogStore } from '@/components/00.shared/stores/dialog'
import MapLayers from './ui/index.vue'

export { default } from './ui/index.vue'

export function openMapLayers() {
  const { open } = useDialogStore()

  open(MapLayers, {}, {
    position: 'end center',
    headerModal: false,
  })
}
