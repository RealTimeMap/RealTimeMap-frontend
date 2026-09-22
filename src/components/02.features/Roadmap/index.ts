import { useDialogStore } from '@/components/00.shared/stores/dialog'
import Roadmap from './ui/Roadmap.vue'

export { default as RoadmapTimeline } from './ui/RoadmapTimeline.vue'

export function openRoadmap(): void {
  const dialog = useDialogStore()
  dialog.open(Roadmap, undefined, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
