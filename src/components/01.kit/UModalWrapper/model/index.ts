import type { Ref } from 'vue'
import { useSwipe } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'

export function useDialog(swipeZoneRef: Ref<HTMLElement | null>) {
  const dialogStore = useDialogStore()
  const { dialogs } = storeToRefs(dialogStore)

  function handleOverlayClick(index: number) {
    const dialog = dialogs.value[index]
    if (dialog?.options.closeOnOverlayClick) {
      dialogStore.close()
    }
  }

  const isAnimatingOut = ref(false)
  const translateY = ref(0)
  const isBodyAtTop = ref(true)

  let scrollTopAtGestureStart = 0

  function handleBodyScroll(e: Event) {
    const target = e.target as HTMLElement
    isBodyAtTop.value = target.scrollTop <= 0
  }

  const { isSwiping, lengthY } = useSwipe(swipeZoneRef, {
    onSwipeStart() {
      const scrollBody = swipeZoneRef.value?.querySelector('.modal-wrapper__body')
      scrollTopAtGestureStart = scrollBody ? scrollBody.scrollTop : 0
    },
    onSwipe(e) {
      if (scrollTopAtGestureStart > 0) {
        return
      }
      if (lengthY.value < 0 && isBodyAtTop.value) {
        translateY.value = Math.abs(lengthY.value)

        if (e.cancelable)
          e.preventDefault()
      }
    },
    onSwipeEnd(e, direction) {
      if (scrollTopAtGestureStart > 0) {
        translateY.value = 0
        return
      }

      const isFastFlick = direction === 'down' && lengthY.value < -40
      const isDraggedFarEnough = translateY.value > 80

      if (isBodyAtTop.value && (isFastFlick || isDraggedFarEnough)) {
        isAnimatingOut.value = true
        translateY.value = window.innerHeight

        setTimeout(() => {
          dialogStore.close()
          isAnimatingOut.value = false
          translateY.value = 0
          isBodyAtTop.value = true
          scrollTopAtGestureStart = 0
        }, 200)
      }
      else {
        translateY.value = 0
      }
    },
  })

  function getSwipeStyle(index: number) {
    const isLast = index === dialogs.value.length - 1

    if (isLast) {
      if (isAnimatingOut.value) {
        return {
          transform: 'translateY(100%)',
          transition: 'transform 0.2s cubic-bezier(0.32, 0.94, 0.6, 1)',
        }
      }

      if (isSwiping.value && translateY.value > 0) {
        return {
          transform: `translateY(${translateY.value}px)`,
          transition: 'none',
        }
      }

      if (translateY.value > 0) {
        return {
          transform: 'translateY(0px)',
          transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
        }
      }
    }

    return {}
  }

  return {
    getSwipeStyle,
    handleBodyScroll,

    dialogs,
    close: dialogStore.close,
    handleOverlayClick,
  }
}
