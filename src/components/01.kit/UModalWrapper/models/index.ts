import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/shared/stores/dialog'

export function useDialog() {
  const dialogStore = useDialogStore()
  const { dialogs } = storeToRefs(dialogStore)

  function handleOverlayClick(index: number) {
    const dialog = dialogs.value[index]
    if (dialog?.options.closeOnOverlayClick) {
      dialogStore.close()
    }
  }

  return {
    dialogs,
    close: dialogStore.close,
    handleOverlayClick,
  }
}
