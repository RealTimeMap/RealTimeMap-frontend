import type { Cluster, Mark, MarksOrClusterResponse } from '@/components/00.shared/services/mark/index.type'
import type { MarksRequestPayload } from '@/types/socketEvents'
import { Network } from '@capacitor/network'
import { useWebSocket } from '@/components/00.shared/composables/useWebSocket'
import { purgeLegacyMarksCache, readLastMarksArea, readMarksArea, writeMarksArea } from './marksCache'

const MARKS_NAMESPACE = '/marks'

export function useMarksSocket() {
  void purgeLegacyMarksCache()
  const { on, emit, getSocketState } = useWebSocket()

  const marks = ref<Mark[]>([])
  const clusters = ref<Cluster[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const generateCacheKey = (screen: MarksRequestPayload['screen'], zoom: number) => {
    if (!screen)
      return null
    const ltLat = screen.leftTop.lat.toFixed(2)
    const ltLon = screen.leftTop.lon.toFixed(2)
    const rbLat = screen.rightBottom.lat.toFixed(2)
    const rbLon = screen.rightBottom.lon.toFixed(2)
    return `map_cache_${ltLat}_${ltLon}_${rbLat}_${rbLon}_z${zoom}`
  }

  let lastParams: MarksRequestPayload | null = null

  const fetchMarks = async (params: MarksRequestPayload) => {
    lastParams = params
    const socketState = getSocketState(MARKS_NAMESPACE)
    const networkStatus = await Network.getStatus()

    const hasNetwork = networkStatus.connected
    const isSocketConnected = socketState?.isConnected || false
    const isOffline = !hasNetwork || !isSocketConnected

    const cacheKey = generateCacheKey(params.screen, params.zoomLevel)

    if (isOffline) {
      if (!cacheKey)
        return

      isLoading.value = true
      try {
        const cachedData = await readMarksArea(cacheKey) ?? await readLastMarksArea()
        if (cachedData) {
          marks.value = cachedData.marks || []
          clusters.value = cachedData.clusters || []
          error.value = null
        }
        else {
          error.value = 'Данные карты недоступны без интернета.'
        }
      }
      catch (e) {
        console.error('[Cache Read Error]', e)
      }
      finally {
        isLoading.value = false
      }
      return
    }

    isLoading.value = true
    error.value = null
    emit(MARKS_NAMESPACE, 'message', params, async (res: MarksOrClusterResponse) => {
      isLoading.value = false

      if ('marks' in res) {
        marks.value = res.marks
        clusters.value = []
      }
      else if ('cluster' in res) {
        clusters.value = res.cluster
        marks.value = []
      }

      if (cacheKey)
        writeMarksArea(cacheKey, { marks: toRaw(marks.value), clusters: toRaw(clusters.value) })
    })
  }

  /** Метки, пришедшие по сокету только что — их показываем с анимацией падения. */
  const recentlyCreated = shallowRef<ReadonlySet<number>>(new Set())
  const RECENT_MS = 3000

  const handleMarkCreated = (newMark: Mark) => {
    const exists = marks.value.find(m => m.id === newMark.id)

    if (!exists) {
      marks.value.push(newMark)
      recentlyCreated.value = new Set([...recentlyCreated.value, newMark.id])
      setTimeout(() => {
        const next = new Set(recentlyCreated.value)
        next.delete(newMark.id)
        recentlyCreated.value = next
      }, RECENT_MS)
    }
  }

  const unsubscribes = [
    // on(MARKS_NAMESPACE, 'marksGet', handleGetMarks),
    on(MARKS_NAMESPACE, 'marksCreated', handleMarkCreated),
  ]

  // Первый запрос мог уйти до подключения сокета и отработать как офлайн (из кэша).
  // Границы с тех пор не менялись, поэтому MarksLayer сам не повторит — повторяем при подключении
  const stopReconnectWatch = watch(
    () => getSocketState(MARKS_NAMESPACE)?.isConnected,
    (connected, wasConnected) => {
      if (connected && !wasConnected && lastParams)
        void fetchMarks(lastParams)
    },
  )

  onUnmounted(() => {
    unsubscribes.forEach(fn => fn())
    stopReconnectWatch()
  })

  return {
    marks: readonly(marks),
    clusters: readonly(clusters),
    isLoading: readonly(isLoading),
    error: readonly(error),
    recentlyCreated,
    fetchMarks,
  }
}
