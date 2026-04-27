import type { MarksRequestPayload } from '@/types/socketEvents'
import type { Cluster, Mark, MarksOrClusterResponse } from '@/utils/mark/index.type'
import { useWebSocket } from '@/composables/useWebSocket'

const MARKS_NAMESPACE = '/marks'

export function useMarksSocket() {
  const { on, emit, getSocketState } = useWebSocket()

  const marks = ref<Mark[]>([])
  const clusters = ref<Cluster[]>([])

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
    emit(MARKS_NAMESPACE, 'message', params, (res: MarksOrClusterResponse) => {
      isLoading.value = false

      if ('marks' in res) {
        marks.value = res.marks
        clusters.value = []
      }
      else if ('cluster' in res) {
        clusters.value = res.cluster
        marks.value = []
      }
    })
  }

  const handleMarkCreated = (newMark: Mark) => {
    const exists = marks.value.find(m => m.id === newMark.id)

    if (!exists) {
      marks.value.push(newMark)
    }
  }

  // const handleGetMarks = (receivedMarks: Mark[]) => {
  //   marks.value = receivedMarks
  //   isLoading.value = false
  // }

  const unsubscribes = [
    // on(MARKS_NAMESPACE, 'marksGet', handleGetMarks),
    on(MARKS_NAMESPACE, 'marksCreated', handleMarkCreated),
  ]

  onUnmounted(() => {
    unsubscribes.forEach(fn => fn())
  })

  return {
    marks: readonly(marks),
    clusters: readonly(clusters),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchMarks,
  }
}
