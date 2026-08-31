<script lang="ts" setup>
import type { ChatMessage } from '@/components/00.shared/services/chats/index.type'
import { useInfiniteScroll } from '@vueuse/core'
import { formatDayLabel } from '@/components/00.shared/lib/date/FormatDate'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  messages: readonly ChatMessage[]
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  peerLastReadId: number
}>()

const emit = defineEmits<{
  loadMore: []
  retry: [clientMessageId: string]
}>()

interface FeedItem {
  message: ChatMessage
  dayLabel: string | null
  isOwn: boolean
  showSender: boolean
  isRead: boolean
}

const auth = useAuthStore()
const feedEl = useTemplateRef<HTMLElement>('feed')

const items = computed<FeedItem[]>(() => {
  const currentUserId = auth.user?.userId

  return props.messages.map((message, index) => {
    const prev = props.messages[index - 1]
    const isNewDay = !prev
      || new Date(prev.createdAt).toDateString() !== new Date(message.createdAt).toDateString()

    return {
      message,
      dayLabel: isNewDay ? formatDayLabel(message.createdAt) : null,
      isOwn: message.sender.id === currentUserId,
      showSender: isNewDay || prev?.sender.id !== message.sender.id,
      // курсор прочтения собеседника монотонный: всё до него включительно прочитано
      isRead: message.id > 0 && message.id <= props.peerLastReadId,
    }
  })
})

async function scrollToBottom() {
  await nextTick()

  requestAnimationFrame(() => {
    const el = feedEl.value
    if (el)
      el.scrollTop = el.scrollHeight
  })
}
let pendingRestore: { height: number, top: number } | null = null

useInfiniteScroll(feedEl, () => {
  const el = feedEl.value
  if (el)
    pendingRestore = { height: el.scrollHeight, top: el.scrollTop }

  emit('loadMore')
}, {
  distance: 200,
  direction: 'top',
  canLoadMore: () => props.hasMore && !props.isLoadingMore,
})

watch(() => props.messages, async () => {
  if (!pendingRestore)
    return scrollToBottom()

  const { height, top } = pendingRestore
  pendingRestore = null

  await nextTick()
  const el = feedEl.value
  if (el)
    el.scrollTop = el.scrollHeight - height + top
})

watch(() => props.isLoadingMore, (loading) => {
  if (!loading)
    pendingRestore = null
})

onMounted(() => {
  scrollToBottom()
  window.visualViewport?.addEventListener('resize', scrollToBottom)
})

onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', scrollToBottom)
})
</script>

<template>
  <div
    ref="feed"
    class="feed"
  >
    <div
      v-if="isLoading"
      class="feed__status"
    >
      Загрузка сообщений...
    </div>

    <div
      v-else-if="!items.length"
      class="feed__status"
    >
      Сообщений пока нет
    </div>

    <div
      v-else
      class="feed__list"
    >
      <template
        v-for="item in items"
        :key="item.message.id"
      >
        <div
          v-if="item.dayLabel"
          class="feed__day"
        >
          {{ item.dayLabel }}
        </div>

        <message-bubble
          :message="item.message"
          :is-own="item.isOwn"
          :show-sender="item.showSender"
          :is-read="item.isRead"
          @retry="(id) => emit('retry', id)"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.feed {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  -webkit-overflow-scrolling: touch;

  &__list {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--surface-hover);
    border-radius: 10px;
  }

  &__status {
    margin: auto;
    @include label-text(14px, none);
  }

  &__day {
    align-self: center;
    margin: 10px 0 4px;
    @include label-text(12px, none);
  }
}
</style>
