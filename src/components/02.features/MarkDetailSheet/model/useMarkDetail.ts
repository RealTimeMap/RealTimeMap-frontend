import type { Ref } from 'vue'
import type { MarkComment, MarkCommentPayload, MarkFull } from '@/components/00.shared/services/mark/index.type'
import { Preferences } from '@capacitor/preferences'
import { useDebounceFn } from '@vueuse/core'
import { useGeocoding } from '@/components/00.shared/composables/useGeocoding'
import { markApi } from '@/components/00.shared/services/mark'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

export function useMarkDetail(
  markId: number,
  scrollContainerRef: Ref<HTMLElement | null>,
) {
  const { address, fetchAddress } = useGeocoding()
  const authStore = useAuthStore()
  const notify = useNotificationStore()
  // --- Data State ---
  const marksCache = new Map<number, MarkFull>()
  const mark = ref<MarkFull | null>(null)
  const comments = ref<MarkComment[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // --- Comment Form State ---
  const commentText = ref('')
  const isSending = ref(false)

  // --- Reactions State ---
  const likeCount = ref(0)
  const isLiked = ref(false)
  const canLike = ref(false)
  const shareCount = ref(0)
  const isSharing = ref(false)

  const serverLiked = ref(false)
  const serverCount = ref(0)

  function applyReactions(m: MarkFull | null) {
    likeCount.value = m?.like?.count ?? 0
    isLiked.value = m?.like?.isLiked ?? false
    canLike.value = m?.like?.canLike ?? false
    serverLiked.value = isLiked.value
    serverCount.value = likeCount.value
    shareCount.value = m?.share?.count ?? 0
  }

  const cacheKey = `mark_detail_${markId}`

  async function fetchData() {
    error.value = null
    comments.value = []

    if (marksCache.has(markId)) {
      mark.value = marksCache.get(markId)!
      applyReactions(mark.value)
    }

    try {
      isLoading.value = true
      if (!mark.value) {
        const data = await markApi.getMarkFull(markId)
        marksCache.set(markId, data)
        mark.value = data
        applyReactions(data)
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
          applyReactions(mark.value)

          if (mark.value?.geom?.coordinates) {
            fetchAddress(mark.value.geom.coordinates).catch(() => { })
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

  const syncLike = useDebounceFn(async () => {
    const desired = isLiked.value
    if (desired === serverLiked.value)
      return

    try {
      const res = desired
        ? await markApi.postMarkLike(markId)
        : await markApi.deleteMarkLike(markId)
      serverLiked.value = res.isLiked
      serverCount.value = res.count
      isLiked.value = res.isLiked
      likeCount.value = res.count
      canLike.value = res.canLike
    }
    catch (e) {
      isLiked.value = serverLiked.value
      likeCount.value = serverCount.value
      console.error('[Mark Like]', e)
      notify.add({ title: 'Не удалось изменить оценку', type: 'error' })
    }
  }, 500)

  function toggleLike() {
    if (!authStore.isAuthenticated) {
      notify.add({ title: 'Войдите, чтобы оценить метку', type: 'warning' })
      return
    }

    isLiked.value = !isLiked.value
    likeCount.value += isLiked.value ? 1 : -1
    syncLike()
  }

  async function registerShare() {
    if (isSharing.value)
      return

    isSharing.value = true
    try {
      const res = await markApi.postMarkShare(markId)
      shareCount.value = res.count
    }
    catch (e) {
      console.error('[Mark Share]', e)
    }
    finally {
      isSharing.value = false
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

    likeCount,
    isLiked,
    canLike,
    toggleLike,
    shareCount,
    isSharing,
    registerShare,
  }
}
