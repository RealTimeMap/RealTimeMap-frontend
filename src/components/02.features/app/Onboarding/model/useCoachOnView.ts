import type { Ref } from 'vue'
import { useCoachmarks } from './useCoachmarks'

export interface CoachViewTip {
  id: string
  el: Ref<HTMLElement | null>
  text: string
  icon?: string
}

interface Options {
  /** Показывать ли вообще (например, только на своём профиле) */
  enabled?: () => boolean
  /** Автозакрытие подсказки, мс */
  timeout?: number
  /** Порог видимости блока для срабатывания */
  threshold?: number
}

export function useCoachOnView(tips: CoachViewTip[], options: Options = {}) {
  const { shouldShow, markSeen } = useCoachmarks()
  const { timeout = 9000, threshold = 0.6 } = options

  const activeTip = ref<CoachViewTip | null>(null)
  const queue: CoachViewTip[] = []
  const observed = new Set<string>()
  let observer: IntersectionObserver | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function showNext() {
    if (activeTip.value || queue.length === 0)
      return
    activeTip.value = queue.shift()!
    timer = setTimeout(dismiss, timeout)
  }

  function dismiss() {
    if (!activeTip.value)
      return
    markSeen(activeTip.value.id)
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    activeTip.value = null
    setTimeout(showNext, 400)
  }

  function tryObserve(tip: CoachViewTip) {
    const el = tip.el.value
    if (!el || !observer || observed.has(tip.id))
      return
    observed.add(tip.id)
    shouldShow(tip.id).then((ok) => {
      if (ok && tip.el.value && observer)
        observer.observe(tip.el.value)
    })
  }

  if (!options.enabled || options.enabled()) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting)
          continue
        const tip = tips.find(t => t.el.value === entry.target)
        if (tip) {
          observer?.unobserve(entry.target)
          queue.push(tip)
          showNext()
        }
      }
    }, { threshold })

    for (const tip of tips)
      watch(tip.el, () => tryObserve(tip), { immediate: true })
  }

  onUnmounted(() => {
    observer?.disconnect()
    if (timer)
      clearTimeout(timer)
  })

  return {
    activeTip,
    dismiss,
  }
}
