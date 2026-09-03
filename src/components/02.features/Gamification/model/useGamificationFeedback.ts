import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

export interface XpGain {
  amount: number
  key: number
}

export function useGamificationFeedback() {
  const { user } = storeToRefs(useAuthStore())

  const xpGain = ref<XpGain | null>(null)

  let prevXp: number | null = null
  let prevLevel: number | null = null
  let xpKey = 0
  let xpTimer: ReturnType<typeof setTimeout> | null = null

  function showXp(amount: number) {
    xpGain.value = { amount, key: ++xpKey }
    if (xpTimer)
      clearTimeout(xpTimer)
    xpTimer = setTimeout(() => {
      xpGain.value = null
    }, 1900)
  }

  watch(
    () => user.value?.gamification,
    (g) => {
      if (!g)
        return
      if (prevLevel === null || prevXp === null) {
        prevXp = g.currentXp
        prevLevel = g.currentLevel
        return
      }
      else if (g.currentXp > prevXp) {
        showXp(g.currentXp - prevXp)
      }

      prevXp = g.currentXp
      prevLevel = g.currentLevel
    },
    { deep: true, immediate: true },
  )

  onUnmounted(() => {
    if (xpTimer)
      clearTimeout(xpTimer)
  })

  return {
    xpGain,
  }
}
