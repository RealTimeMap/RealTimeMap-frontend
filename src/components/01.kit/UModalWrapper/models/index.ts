import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/shared/stores/dialog'

export function useDialog() {
  const dialogStore = useDialogStore()
  const { isVisible, activeDialog } = storeToRefs(dialogStore)

  const options = computed(() => activeDialog.value?.options)

  function onAfterLeave() {
    dialogStore.destroy()
  }

  function handleOverlayClick() {
    if (options.value?.closeOnOverlayClick) {
      dialogStore.close()
    }
  }

  return {
    activeDialog,
    isVisible,
    options,
    close: dialogStore.close,
    onAfterLeave,
    handleOverlayClick,
  }
}
