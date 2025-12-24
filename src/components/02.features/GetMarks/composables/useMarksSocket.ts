import type { MarksRequestPayload } from '@/types/socketEvents'
import type { Mark } from '@/utils/mark/index.type'
import { useWebSocket } from '@/composables/useWebSocket'

const MARKS_NAMESPACE = '/marks'

export function useMarksSocket() {
  const { on, emit, getSocketState } = useWebSocket()

  const marks = ref<Mark[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchMarks = (params: MarksRequestPayload) => {
    const socketState = getSocketState(MARKS_NAMESPACE)
    if (!socketState?.isConnected) {
      const errorMessage = '[Marks] Невозможно запросить метки: сокет не подключен.'
      console.error(errorMessage)
      error.value = errorMessage
      return
    }

    isLoading.value = true
    error.value = null
    emit(MARKS_NAMESPACE, 'marks_message', params)
  }

  const handleMarkCreated = (newMark: Mark) => {
    const exists = marks.value.find(m => m.id === newMark.id)

    if (!exists) {
      marks.value.push(newMark)
    }
  }

  const handleGetMarks = (receivedMarks: Mark[]) => {
    marks.value = receivedMarks
    isLoading.value = false
  }

  const unsubscribes = [
    on(MARKS_NAMESPACE, 'marks_get', handleGetMarks),
    on(MARKS_NAMESPACE, 'marks_created', handleMarkCreated),
  ]

  onUnmounted(() => {
    unsubscribes.forEach(fn => fn())
  })

  return {
    marks: readonly(marks),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchMarks,
  }
}
