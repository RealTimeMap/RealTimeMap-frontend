import { useDialogStore } from '@/components/00.shared/stores/dialog'
import ForgotPassword from './ui/index.vue'

export function openForgotPassword(email?: string): void {
  const dialog = useDialogStore()
  dialog.open(ForgotPassword, { email }, {
    title: 'Восстановление пароля',
    width: '500px',
    position: 'end center',
    closeable: false,
  })
}

export { default } from './ui/index.vue'
