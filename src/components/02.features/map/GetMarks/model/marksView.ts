import type { Mark } from '@/components/00.shared/services/mark/index.type'

/**
 * Общее состояние меток в кадре: его читают слой меток, карточка быстрого просмотра
 * и панель «Что рядом».
 */
export const useMarksViewStore = defineStore('marksView', () => {
  const marks = shallowRef<Mark[]>([])
  const previewId = ref<number | null>(null)
  /** Метка, к которой слою нужно перелететь (из списка «Что рядом»). */
  const flyToId = ref<number | null>(null)

  function preview(id: number, options: { fly?: boolean } = {}) {
    previewId.value = id
    if (options.fly)
      flyToId.value = id
  }

  function closePreview() {
    previewId.value = null
  }

  return { marks, previewId, flyToId, preview, closePreview }
})
