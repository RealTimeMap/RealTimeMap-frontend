import type { Cluster, Mark, MarksOrClusterResponse } from '@/components/00.shared/services/mark/index.type'
import type { MarksRequestPayload } from '@/types/socketEvents'
import { Network } from '@capacitor/network'
import { Preferences } from '@capacitor/preferences'
import { useWebSocket } from '@/components/00.shared/composables/useWebSocket'

const MARKS_NAMESPACE = '/marks'

export function useMarksSocket() {
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

  const fetchMarks = async (params: MarksRequestPayload) => {
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
        const { value } = await Preferences.get({ key: cacheKey })
        if (value) {
          const cachedData = JSON.parse(value)
          marks.value = cachedData.marks || []
          clusters.value = cachedData.clusters || []
          error.value = null
        }
        else {
          const { value: lastGlobal } = await Preferences.get({ key: 'map_last_visible_marks' })
          if (lastGlobal) {
            const globalData = JSON.parse(lastGlobal)
            marks.value = globalData.marks || []
            clusters.value = globalData.clusters || []
          }
          else {
            error.value = 'Данные карты недоступны без интернета.'
          }
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

      if (cacheKey) {
        const dataToCache = { marks: marks.value, clusters: clusters.value }

        try {
          await Preferences.set({
            key: cacheKey,
            value: JSON.stringify(dataToCache),
          })
          await Preferences.set({
            key: 'map_last_visible_marks',
            value: JSON.stringify(dataToCache),
          })
        }
        catch (e) {
          console.error('[Cache Write Error]', e)
        }
      }
    })
  }

  const handleMarkCreated = (newMark: Mark) => {
    const exists = marks.value.find(m => m.id === newMark.id)

    if (!exists) {
      marks.value.push(newMark)
    }
  }

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
