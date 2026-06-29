import type { Ref } from 'vue'
import type { MarkComment, MarkCommentPayload, MarkFull } from '@/utils/mark/index.type'
import { useMessage } from 'naive-ui'
import { useGeocoding } from '@/composables/useGeocoding'
import { markApi } from '@/utils/mark'

export function useMarkDetail(
  markId: number,
  scrollContainerRef: Ref<HTMLElement | null>,
) {
  const message = useMessage()
  const { address, fetchAddress } = useGeocoding()

  // --- Data State ---
  const marksCache = new Map<number, MarkFull>()
  const mark = ref<MarkFull | null>(null)
  const comments = ref<MarkComment[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // --- Comment Form State ---
  const commentText = ref('')
  const isSending = ref(false)

  async function fetchData() {
    error.value = null
    comments.value = []

    if (marksCache.has(markId)) {
      mark.value = marksCache.get(markId)!
    }

    try {
      if (!mark.value) {
        isLoading.value = true
        const data = await markApi.getMarkFull(markId)
        marksCache.set(markId, data)
        mark.value = data
      }

      if (mark.value?.geom?.coordinates) {
        fetchAddress(mark.value.geom.coordinates)
      }

      const dataComments = await markApi.getMarkComments(markId)
      comments.value = dataComments.items.reverse()
    }
    catch (e) {
      console.error(e)
      error.value = 'Ошибка загрузки данных.'
    }
    finally {
      isLoading.value = false
    }
  }

  function scrollToBottom() {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTo({
        top: scrollContainerRef.value.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  async function handlePostComment() {
    const content = commentText.value.trim()
    if (!content)
      return

    isSending.value = true
    try {
      const payload: MarkCommentPayload = {
        content,
        parentId: null,
        entityId: markId,
        entity: 'mark',
      }

      const newComment = await markApi.postMarkComment(payload)

      comments.value.push(newComment)

      commentText.value = ''
      message.success('Комментарий отправлен')

      await nextTick()
      scrollToBottom()
    }
    catch (e) {
      console.error(e)
      message.error('Не удалось отправить комментарий')
    }
    finally {
      isSending.value = false
    }
  }

  function formatDate(
    dateString: string,
    showTime?: boolean,
  ) {
    if (!dateString)
      return '—'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime()))
      return '—'

    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(showTime && {
        hour: 'numeric',
        minute: 'numeric',
      }),
    })
  }

  return {
    comments,
    commentText,
    error,
    fetchData,
    formatDate,
    handlePostComment,
    isLoading,
    isSending,
    mark,
    scrollContainerRef,

    address,
    fetchAddress,
  }
}
