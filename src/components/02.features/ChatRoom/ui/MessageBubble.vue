<script lang="ts" setup>
import type { Message } from '@/components/00.shared/services/chats/index.type'
import { formatTime } from '@/components/00.shared/lib/date/FormatDate'

defineProps<{
  message: Message
  isOwn: boolean
  showSender: boolean
}>()
</script>

<template>
  <div
    class="bubble-row"
    :class="{ 'bubble-row--own': isOwn }"
  >
    <div
      class="bubble"
      :class="{ 'bubble--own': isOwn }"
    >
      <span
        v-if="showSender && !isOwn"
        class="bubble__sender"
      >
        {{ message.sender.username }}
      </span>

      <span class="bubble__content">{{ message.content }}</span>

      <span class="bubble__time">{{ formatTime(message.createdAt) }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bubble-row {
  display: flex;
  justify-content: flex-start;

  &--own {
    justify-content: flex-end;
  }
}

.bubble {
  position: relative;
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.07);
  font-size: 15px;
  line-height: 1.35;
  word-break: break-word;

  &--own {
    background: linear-gradient(120deg, #4a5bf7 0%, #8b3df0 100%);
  }

  &__sender {
    display: block;
    margin-bottom: 2px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-color);
  }

  &__content {
    white-space: pre-wrap;
  }

  /* Время дотекает до конца последней строки, как в мессенджерах */
  &__time {
    float: right;
    margin: 6px 0 0 8px;
    font-size: 11px;
    line-height: 1;
    color: rgba(255, 255, 255, 0.35);
    user-select: none;
  }

  &--own &__time {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
