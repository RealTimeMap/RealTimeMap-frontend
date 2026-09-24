import type { SplashStyle } from '@/components/00.shared/stores/settings/parts/useExperimental'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import SplashStylePicker from './ui/SplashStylePicker.vue'

export { default as AppSplash } from './ui/AppSplash.vue'

export const SPLASH_STYLE_LABELS: Record<SplashStyle, string> = {
  off: 'Выключено',
  shield: 'Щит',
  spin: 'Раскрытие',
}

export function openSplashStylePicker(): void {
  const dialog = useDialogStore()
  dialog.open(SplashStylePicker, undefined, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}
