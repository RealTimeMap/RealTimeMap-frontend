import type { MarkMenuStyle } from '@/components/00.shared/stores/settings/parts/useExperimental'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import StylePicker from './ui/StylePicker.vue'

export { default } from './ui/index.vue'

export const MARK_MENU_STYLE_LABELS: Record<MarkMenuStyle, string> = {
  off: 'Выключено',
  popover: 'Карточка',
  orbit: 'Орбита',
  bar: 'Панель',
  segment: 'Тумблер',
}

export function openMarkMenuStylePicker(): void {
  const dialog = useDialogStore()
  dialog.open(StylePicker, undefined, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
