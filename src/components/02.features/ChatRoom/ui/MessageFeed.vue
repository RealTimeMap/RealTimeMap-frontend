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
  isPeerTyping?: boolean
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
  isGroupStart: boolean
  isGroupEnd: boolean
}

function sameGroup(a?: ChatMessage, b?: ChatMessage) {
  return !!a && !!b
    && a.sender.id === b.sender.id
    && new Date(a.createdAt).toDateString() === new Date(b.createdAt).toDateString()
}

const auth = useAuthStore()
const feedEl = useTemplateRef<HTMLElement>('feed')

const isAtBottom = ref(true)
const newCount = ref(0)
let prevLen = 0

const items = computed<FeedItem[]>(() => {
  const currentUserId = auth.user?.userId

  return props.messages.map((message, index) => {
    const prev = props.messages[index - 1]
    const next = props.messages[index + 1]
    const isNewDay = !prev
      || new Date(prev.createdAt).toDateString() !== new Date(message.createdAt).toDateString()

    return {
      message,
      dayLabel: isNewDay ? formatDayLabel(message.createdAt) : null,
      isOwn: message.sender.id === currentUserId,
      showSender: isNewDay || prev?.sender.id !== message.sender.id,
      // курсор прочтения собеседника монотонный: всё до него включительно прочитано
      isRead: message.id > 0 && message.id <= props.peerLastReadId,
      isGroupStart: !sameGroup(prev, message),
      isGroupEnd: !sameGroup(next, message),
    }
  })
})

async function scrollToBottom(smooth = false) {
  await nextTick()

  requestAnimationFrame(() => {
    const el = feedEl.value
    if (!el)
      return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    newCount.value = 0
    isAtBottom.value = true
  })
}

function onScroll() {
  const el = feedEl.value
  if (!el)
    return
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  isAtBottom.value = distanceFromBottom < 80
  if (isAtBottom.value)
    newCount.value = 0
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
  // Догрузка истории вверх — сохраняем позицию, не прыгаем
  if (pendingRestore) {
    const { height, top } = pendingRestore
    pendingRestore = null
    prevLen = props.messages.length
    await nextTick()
    const el = feedEl.value
    if (el)
      el.scrollTop = el.scrollHeight - height + top
    return
  }

  const grew = props.messages.length > prevLen
  const delta = props.messages.length - prevLen
  prevLen = props.messages.length

  const last = props.messages[props.messages.length - 1]
  const lastIsOwn = last?.sender.id === auth.user?.userId

  if (lastIsOwn || isAtBottom.value)
    scrollToBottom(true)
  else if (grew)
    newCount.value += Math.max(delta, 0)
})

watch(() => props.isLoadingMore, (loading) => {
  if (!loading)
    pendingRestore = null
})

// Появился индикатор печати — если внизу, показываем его целиком
watch(() => props.isPeerTyping, (typing) => {
  if (typing && isAtBottom.value)
    scrollToBottom(true)
})

onMounted(() => {
  prevLen = props.messages.length
  scrollToBottom()
  window.visualViewport?.addEventListener('resize', onViewportResize)
})

onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', onViewportResize)
})

function onViewportResize() {
  if (isAtBottom.value)
    scrollToBottom()
}
</script>

<template>
  <div class="feed-wrap">
    <div
      ref="feed"
      class="feed"
      @scroll.passive="onScroll"
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
            :is-group-start="item.isGroupStart"
            :is-group-end="item.isGroupEnd"
            @retry="(id) => emit('retry', id)"
          />
        </template>

        <transition name="typing">
          <div
            v-if="isPeerTyping"
            class="typing-bubble"
          >
            <span />
            <span />
            <span />
          </div>
        </transition>
      </div>
    </div>

    <transition name="scroll-pill">
      <button
        v-if="!isAtBottom && items.length"
        type="button"
        class="scroll-pill"
        aria-label="К последним сообщениям"
        @click="scrollToBottom(true)"
      >
        <u-icon
          icon="solar:alt-arrow-down-linear"
          width="20"
          height="20"
        />
        <span
          v-if="newCount > 0"
          class="scroll-pill__badge"
        >{{ newCount > 99 ? '99+' : newCount }}</span>
      </button>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.feed-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

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
    gap: 2px;
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

.typing-bubble {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 12px 14px;
  border-radius: 18px;
  background: var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-color-muted);
    animation: typing-dot 1.2s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.18s;
    }
    &:nth-child(3) {
      animation-delay: 0.36s;
    }
  }
}

@keyframes typing-dot {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.scroll-pill {
  position: absolute;
  right: 14px;
  bottom: 12px;
  z-index: 2;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0.5px solid var(--border-subtle);
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-color);
  background: var(--u-modal-wrapper-bg, var(--bg-color-block));
  box-shadow: rgba(0, 0, 0, 0.28) 0px 6px 18px;

  &:active {
    transform: scale(0.92);
  }

  &__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    background: var(--primary-color);
  }
}

.scroll-pill-enter-active,
.scroll-pill-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.scroll-pill-enter-from,
.scroll-pill-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}

.typing-enter-active,
.typing-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.typing-enter-from,
.typing-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
