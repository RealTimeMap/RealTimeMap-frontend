<script lang="ts" setup>
import type { Message } from '@/components/00.shared/services/chats/index.type'
import { formatDayLabel } from '@/components/00.shared/lib/date/FormatDate'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  messages: readonly Message[]
  isLoading: boolean
}>()

interface FeedItem {
  message: Message
  dayLabel: string | null
  isOwn: boolean
  showSender: boolean
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

watch(() => props.messages, scrollToBottom)

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
    background: rgba(255, 255, 255, 0.1);
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
