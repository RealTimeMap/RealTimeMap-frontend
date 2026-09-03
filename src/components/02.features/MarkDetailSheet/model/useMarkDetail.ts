import type { Ref } from 'vue'
import type { MarkComment, MarkCommentPayload, MarkFull, MarkStat } from '@/components/00.shared/services/mark/index.type'
import { Preferences } from '@capacitor/preferences'
import { useDebounceFn } from '@vueuse/core'
import { useGeocoding } from '@/components/00.shared/composables/useGeocoding'
import { hapticLight } from '@/components/00.shared/lib/haptics'
import { markApi } from '@/components/00.shared/services/mark'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

function parseCount(value: string | number): number {
  if (typeof value === 'number')
    return value
  const s = value.trim().toUpperCase()
  const num = Number.parseFloat(s.replace(/[^\d.]/g, '')) || 0
  if (s.includes('M'))
    return Math.round(num * 1e6)
  if (s.includes('K'))
    return Math.round(num * 1e3)
  return Math.round(num)
}

function formatCount(n: number): string {
  if (n >= 1e6)
    return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} M`
  if (n >= 1e3)
    return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')} K`
  return String(n)
}

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

  const likeDisplay = computed(() => formatCount(likeCount.value))
  const shareDisplay = computed(() => formatCount(shareCount.value))

  const currentUserId = computed(() => authStore.user?.userId ?? null)
  const isMarkOwner = computed(() =>
    !!mark.value && mark.value.owner?.id === currentUserId.value,
  )
  const isDeletingMark = ref(false)

  function applyReactions(m: MarkFull | null) {
    likeCount.value = m?.like?.count ?? 0
    isLiked.value = m?.like?.isLiked ?? false
    canLike.value = m?.like?.canLike ?? false
    serverLiked.value = isLiked.value
    serverCount.value = likeCount.value
    shareCount.value = m?.share?.count ?? 0
  }

  function applyStat(stat: MarkStat) {
    likeCount.value = parseCount(stat.likes)
    shareCount.value = parseCount(stat.shares)
    isLiked.value = stat.isLiked
    canLike.value = stat.canLike
    serverLiked.value = stat.isLiked
    serverCount.value = likeCount.value
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

      let stat: MarkStat | null = null
      try {
        stat = await markApi.getMarkStat(markId)
        applyStat(stat)
      }
      catch (statError) {
        console.error('[Mark Stat]', statError)
      }

      try {
        const dataComments = await markApi.getMarkComments(markId)
        comments.value = dataComments.items.reverse()
      }
      catch (commentsError) {
        console.error('[Mark Comments]', commentsError)
      }

      await Preferences.set({
        key: cacheKey,
        value: JSON.stringify({
          mark: mark.value,
          comments: comments.value,
          stat,
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
          if (cached.stat)
            applyStat(cached.stat)

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

  async function persistCache() {
    try {
      await Preferences.set({
        key: cacheKey,
        value: JSON.stringify({ mark: mark.value, comments: comments.value }),
      })
    }
    catch (e) {
      console.error('[Mark Cache Write]', e)
    }
  }

  // --- Comment interactions ---
  async function toggleCommentLike(comment: MarkComment) {
    if (!authStore.isAuthenticated) {
      notify.add({ title: 'Войдите, чтобы оценить комментарий', type: 'warning' })
      return
    }

    const wasLiked = comment.isLiked ?? false
    comment.isLiked = !wasLiked
    comment.likes += wasLiked ? -1 : 1
    hapticLight()

    try {
      const res = wasLiked
        ? await markApi.unlikeComment(comment.id)
        : await markApi.likeComment(comment.id)
      comment.isLiked = res.liked
      comment.likes = res.likesCount
      await persistCache()
    }
    catch (e) {
      comment.isLiked = wasLiked
      comment.likes += wasLiked ? 1 : -1
      console.error('[Comment Like]', e)
      notify.add({ title: 'Не удалось изменить оценку', type: 'error' })
    }
  }

  async function saveCommentEdit(comment: MarkComment, content: string): Promise<boolean> {
    const trimmed = content.trim()
    if (!trimmed || trimmed === comment.content)
      return false

    try {
      const updated = await markApi.editComment(comment.id, trimmed)
      comment.content = updated.content
      await persistCache()
      notify.add({ title: 'Комментарий обновлён', type: 'success' })
      return true
    }
    catch (e) {
      console.error('[Comment Edit]', e)
      notify.add({ title: 'Не удалось изменить комментарий', type: 'error' })
      return false
    }
  }

  async function removeComment(comment: MarkComment) {
    try {
      await markApi.deleteComment(comment.id)
      comment.content = 'Комментарий удалён'
      comment.meta.status = 'deleted'
      await persistCache()
    }
    catch (e) {
      console.error('[Comment Delete]', e)
      notify.add({ title: 'Не удалось удалить комментарий', type: 'error' })
    }
  }

  async function loadReplies(comment: MarkComment) {
    comment.isLoadingReplies = true
    try {
      const res = await markApi.getCommentReplies(markId, comment.id, { sort: 'oldest' })
      comment.replies = res.items
      comment.repliesLoaded = true
      await persistCache()
    }
    catch (e) {
      console.error('[Comment Replies]', e)
      notify.add({ title: 'Не удалось загрузить ответы', type: 'error' })
    }
    finally {
      comment.isLoadingReplies = false
    }
  }

  async function toggleReplies(comment: MarkComment) {
    if (comment.showReplies) {
      comment.showReplies = false
      return
    }
    comment.showReplies = true
    if (!comment.repliesLoaded)
      await loadReplies(comment)
  }

  async function submitReply(parent: MarkComment, content: string): Promise<boolean> {
    const trimmed = content.trim()
    if (!trimmed || !authStore.isAuthenticated) {
      if (!authStore.isAuthenticated)
        notify.add({ title: 'Войдите, чтобы ответить', type: 'warning' })
      return false
    }

    try {
      const created = await markApi.postMarkComment({
        content: trimmed,
        entityId: markId,
        entity: 'mark',
        parentId: parent.id,
      })

      parent.meta.repliesCount = (parent.meta.repliesCount ?? 0) + 1
      parent.meta.haveReplies = true
      parent.showReplies = true

      if (parent.repliesLoaded) {
        if (!parent.replies)
          parent.replies = []
        parent.replies.push(created)
      }
      else {
        await loadReplies(parent)
      }

      await persistCache()
      return true
    }
    catch (e) {
      console.error('[Comment Reply]', e)
      notify.add({ title: 'Не удалось отправить ответ', type: 'error' })
      return false
    }
  }

  // --- Mark delete ---
  async function removeMark(): Promise<boolean> {
    if (!mark.value || isDeletingMark.value)
      return false

    isDeletingMark.value = true
    try {
      await markApi.deleteMark(mark.value.id)
      await Preferences.remove({ key: cacheKey })
      hapticLight()
      notify.add({ title: 'Метка удалена', type: 'success' })
      authStore.fetchUser()
      return true
    }
    catch (e) {
      console.error('[Mark Delete]', e)
      notify.add({ title: 'Не удалось удалить метку', type: 'error' })
      return false
    }
    finally {
      isDeletingMark.value = false
    }
  }

  async function refreshMark() {
    marksCache.delete(markId)
    mark.value = null
    await fetchData()
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
    hapticLight()
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

    currentUserId,
    isMarkOwner,
    isDeletingMark,
    toggleCommentLike,
    saveCommentEdit,
    removeComment,
    submitReply,
    toggleReplies,
    removeMark,
    refreshMark,

    address,
    fetchAddress,

    likeCount,
    likeDisplay,
    isLiked,
    canLike,
    toggleLike,
    shareCount,
    shareDisplay,
    isSharing,
    registerShare,
  }
}
