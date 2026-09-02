import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import { useCoachmarks } from './useCoachmarks'

type MapHintId = 'clusters' | 'guest'

const MAP_HINT_FLAG: Record<MapHintId, string> = {
  clusters: 'map_clusters',
  guest: 'guest_map_tap',
}

export function useMapCoach() {
  const { shouldShow, markSeen } = useCoachmarks()
  const dialogStore = useDialogStore()
  const { isAuthenticated } = storeToRefs(useAuthStore())

  const activeHintId = ref<MapHintId | null>(null)
  const markCount = ref(0)
  const clusterCount = ref(0)
  const dataSettled = ref(false)
  const canShowClusters = ref(false)
  const canShowGuest = ref(false)
  let readyTimer: ReturnType<typeof setTimeout> | null = null
  let switchTimer: ReturnType<typeof setTimeout> | null = null

  const activeMapHint = computed(() => {
    if (activeHintId.value === 'clusters') {
      return {
        icon: 'solar:layers-minimalistic-bold-duotone',
        text: 'Цифра — это группа меток. Тапните, чтобы приблизить',
      }
    }
    if (activeHintId.value === 'guest') {
      return {
        icon: 'solar:map-point-wave-bold-duotone',
        text: markCount.value > 0
          ? 'Вокруг — метки людей 👀 Откройте любую, чтобы узнать о месте'
          : 'Поблизости пусто — отдалите карту, чтобы увидеть места',
      }
    }
    return null
  })

  function clearSwitch() {
    if (switchTimer) {
      clearTimeout(switchTimer)
      switchTimer = null
    }
  }

  function consume(id: MapHintId) {
    markSeen(MAP_HINT_FLAG[id])
    if (id === 'clusters')
      canShowClusters.value = false
    else
      canShowGuest.value = false
  }

  function setActive(id: MapHintId) {
    clearSwitch()
    activeHintId.value = id
  }

  function dismissMapHint() {
    if (activeHintId.value)
      consume(activeHintId.value)
    activeHintId.value = null
    clearSwitch()
    evaluate()
  }

  function pickHintId(): MapHintId | null {
    if (clusterCount.value > 0 && canShowClusters.value)
      return 'clusters'
    if (clusterCount.value === 0 && canShowGuest.value && (markCount.value > 0 || dataSettled.value))
      return 'guest'
    return null
  }

  function evaluate() {
    const want = pickHintId()
    if (want === activeHintId.value)
      return

    if (activeHintId.value) {
      activeHintId.value = null
      clearSwitch()
      if (want)
        switchTimer = setTimeout(setActive, 320, want)
      return
    }

    if (want)
      setActive(want)
  }

  function handleMarkCount(count: number) {
    markCount.value = count
    evaluate()
  }

  function handleClusterCount(count: number) {
    const wasClusters = clusterCount.value > 0
    clusterCount.value = count
    if (wasClusters && count === 0 && activeHintId.value === 'clusters') {
      consume('clusters')
      activeHintId.value = null
      clearSwitch()
    }
    evaluate()
  }

  async function onMapReady() {
    canShowClusters.value = await shouldShow('map_clusters')
    canShowGuest.value = !isAuthenticated.value && (await shouldShow('guest_map_tap'))
    readyTimer = setTimeout(() => {
      dataSettled.value = true
      evaluate()
    }, 1500)
    evaluate()
  }

  watch(() => dialogStore.dialogs.length, (next, prev) => {
    if (next > prev)
      dismissMapHint()
  })

  onDeactivated(() => {
    activeHintId.value = null
    clearSwitch()
  })

  onUnmounted(() => {
    clearSwitch()
    if (readyTimer)
      clearTimeout(readyTimer)
  })

  return {
    activeMapHint,
    dismissMapHint,
    handleMarkCount,
    handleClusterCount,
    onMapReady,
  }
}
