import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import router from '@/components/00.shared/lib/router'
import { useDialogStore } from '@/components/00.shared/stores/dialog'

export function setupBackButton() {
  if (!Capacitor.isNativePlatform())
    return

  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const dialog = useDialogStore()

    if (dialog.hasDialogs) {
      dialog.close()
      return
    }

    if (canGoBack)
      router.back()
    else
      CapacitorApp.exitApp()
  })
}
