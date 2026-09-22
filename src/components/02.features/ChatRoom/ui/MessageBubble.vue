<script lang="ts" setup>
import type { ChatMessage } from '@/components/00.shared/services/chats/index.type'
import { formatTime } from '@/components/00.shared/lib/date/FormatDate'

const props = withDefaults(defineProps<{
  message: ChatMessage
  isOwn: boolean
  showSender: boolean
  isRead: boolean
  isGroupStart?: boolean
  isGroupEnd?: boolean
}>(), {
  isGroupStart: true,
  isGroupEnd: true,
})

const emit = defineEmits<{
  (e: 'retry', clientMessageId: string): void
}>()

/**
 * Статус показываем только у своих сообщений. У пришедших из истории
 * поля status нет — они заведомо доставлены.
 */
const status = computed(() => {
  if (!props.isOwn)
    return null

  if (props.message.status === 'sending')
    return 'sending'

  if (props.message.status === 'failed')
    return 'failed'

  return props.isRead ? 'read' : 'sent'
})

const showStatus = computed(() => !!status.value)

const statusLabel = {
  sending: 'Отправляется',
  sent: 'Отправлено',
  read: 'Прочитано',
  failed: 'Не отправлено, нажмите чтобы повторить',
} as const

const statusText = computed(() => status.value ? statusLabel[status.value] : '')

function handleRetry() {
  if (status.value === 'failed' && props.message.clientMessageId)
    emit('retry', props.message.clientMessageId)
}
</script>

<template>
  <div
    class="bubble-row"
    :class="{
      'bubble-row--own': isOwn,
      'bubble-row--group-start': isGroupStart,
    }"
  >
    <div
      class="bubble"
      :class="{
        'bubble--own': isOwn,
        'bubble--start': isGroupStart,
        'bubble--end': isGroupEnd,
      }"
    >
      <span
        v-if="showSender && !isOwn"
        class="bubble__sender"
      >
        {{ message.sender.username }}
        <u-admin-badge
          v-if="message.sender.isAdmin"
          :size="14"
        />
      </span>

      <span class="bubble__content">{{ message.content }}</span>

      <span class="bubble__time">
        {{ formatTime(message.createdAt) }}

        <component
          :is="status === 'failed' ? 'button' : 'span'"
          v-if="showStatus"
          class="status"
          :class="`status--${status}`"
          :type="status === 'failed' ? 'button' : undefined"
          :title="statusText"
          :aria-label="statusText"
          @click="handleRetry"
        >
          <svg
            class="status__track"
            viewBox="0 0 22 8"
            aria-hidden="true"
          >
            <path
              class="status__line"
              d="M1 4 H16"
            />
            <circle
              class="status__goal"
              cx="19"
              cy="4"
              r="2.4"
            />
          </svg>
        </component>
      </span>
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

  &--group-start {
    margin-top: 8px;
  }
}

.bubble {
  position: relative;
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 18px;
  background: var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);
  color: var(--text-color);
  font-size: 15px;
  line-height: 1.35;
  word-break: break-word;

  &--own {
    background: var(--accent-gradient, linear-gradient(120deg, #4a5bf7 0%, #8b3df0 100%));
    border-color: transparent;
    color: #fff;
  }

  &--own:not(.bubble--start) {
    border-top-right-radius: 6px;
  }
  &--own:not(.bubble--end) {
    border-bottom-right-radius: 6px;
  }
  &:not(.bubble--own):not(.bubble--start) {
    border-top-left-radius: 6px;
  }
  &:not(.bubble--own):not(.bubble--end) {
    border-bottom-left-radius: 6px;
  }

  &__sender {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 2px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-color);
  }

  &__content {
    white-space: pre-wrap;
  }

  &__time {
    float: right;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 6px 0 0 8px;
    font-size: 11px;
    line-height: 1;
    color: var(--text-color-muted);
    user-select: none;
  }

  &--own &__time {
    margin-top: 4px;
    padding: 3px 7px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(6px);
    color: rgba(255, 255, 255, 0.85);
  }
}

.status {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  flex-shrink: 0;
  line-height: 0;

  &__track {
    width: 22px;
    height: 8px;
    overflow: visible;
  }

  &__line {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  &__goal {
    fill: currentColor;
  }

  &--sending {
    color: rgba(255, 255, 255, 0.85);

    .status__line {
      stroke-dasharray: 2 3;
      animation: track-run 0.8s linear infinite;
    }
  }

  &--sent {
    color: rgba(255, 255, 255, 0.85);
  }

  &--read {
    color: #5eeaff;

    .status__line {
      animation: track-fill 0.45s ease-out;
    }

    .status__goal {
      filter: drop-shadow(0 0 4px currentColor);
    }
  }

  &--failed {
    color: #ff8b8f;
    cursor: pointer;

    .status__line {
      stroke-dasharray: 2 2;
    }
  }
}

@keyframes track-run {
  to {
    stroke-dashoffset: -5;
  }
}

@keyframes track-fill {
  from {
    stroke-dasharray: 0 24;
  }
  to {
    stroke-dasharray: 24 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status__line {
    animation: none !important;
  }
}
</style>
