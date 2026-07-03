import type { Ref } from 'vue'
import type { MarkComment, MarkCommentPayload, MarkFull } from '@/utils/mark/index.type'
import { Preferences } from '@capacitor/preferences'
import { useGeocoding } from '@/composables/useGeocoding'
import { markApi } from '@/utils/mark'

export function useMarkDetail(
  markId: number,
  scrollContainerRef: Ref<HTMLElement | null>,
) {
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

  const cacheKey = `mark_detail_${markId}`

  async function fetchData() {
    error.value = null
    comments.value = []

    if (marksCache.has(markId)) {
      mark.value = marksCache.get(markId)!
    }

    try {
      isLoading.value = true
      if (!mark.value) {
        const data = await markApi.getMarkFull(markId)
        marksCache.set(markId, data)
        mark.value = data
      }

      if (mark.value?.geom?.coordinates) {
        fetchAddress(mark.value.geom.coordinates)
      }

      const dataComments = await markApi.getMarkComments(markId)
      comments.value = dataComments.items.reverse()

      await Preferences.set({
        key: cacheKey,
        value: JSON.stringify({
          mark: mark.value,
          comments: comments.value,
        }),
      })
    }
    catch (e) {
      console.error('[Mark Detail] Сеть недоступна, пытаемся поднять локальный кэш...', e)

      try {
        const { value } = await Preferences.get({ key: cacheKey })
        if (value) {
          const cached = JSON.parse(value)
          mark.value = cached.mark
          comments.value = cached.comments

          if (mark.value?.geom?.coordinates) {
            fetchAddress(mark.value.geom.coordinates).catch(() => {})
          }
        }
        else {
          error.value = 'Данные метки недоступны без интернета.'
        }
      }
      catch (cacheError) {
        console.error('[Mark Detail Cache Error]', cacheError)
        error.value = 'Ошибка загрузки данных.'
      }
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

      await Preferences.set({
        key: cacheKey,
        value: JSON.stringify({
          mark: mark.value,
          comments: comments.value,
        }),
      })

      commentText.value = ''

      await nextTick()
      scrollToBottom()
    }
    catch (e) {
      console.error(e)
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
