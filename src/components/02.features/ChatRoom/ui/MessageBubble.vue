<script lang="ts" setup>
import type { ChatMessage } from '@/components/00.shared/services/chats/index.type'
import { formatTime } from '@/components/00.shared/lib/date/FormatDate'

const props = defineProps<{
  message: ChatMessage
  isOwn: boolean
  showSender: boolean
  isRead: boolean
}>()

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

const statusLabel = {
  sending: 'Отправляется',
  sent: 'Отправлено',
  read: 'Прочитано',
  failed: 'Не отправлено, нажмите чтобы повторить',
} as const

function handleRetry() {
  if (status.value === 'failed' && props.message.clientMessageId)
    emit('retry', props.message.clientMessageId)
}
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

      <span class="bubble__time">
        {{ formatTime(message.createdAt) }}

        <component
          :is="status === 'failed' ? 'button' : 'span'"
          v-if="status"
          class="status"
          :class="`status--${status}`"
          :type="status === 'failed' ? 'button' : undefined"
          :title="statusLabel[status]"
          :aria-label="statusLabel[status]"
          @click="handleRetry"
        >
          <i class="status__core" />
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

  &__time {
    float: right;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 6px 0 0 8px;
    font-size: 11px;
    line-height: 1;
    color: rgba(255, 255, 255, 0.35);
    user-select: none;
  }

  /*
   * У своих сообщений фон — яркий градиент, на котором тонет и время,
   * и индикатор. Уводим их на тёмную стеклянную подложку: она даёт
   * постоянный контраст независимо от того, на какую часть градиента попала.
   */
  &--own &__time {
    margin-top: 4px;
    padding: 3px 7px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(6px);
    color: rgba(255, 255, 255, 0.85);
  }
}

/*
 * Статус доставки как радар-пинг: тот же визуальный язык,
 * что у меток и геолокации на карте.
 */
.status {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 11px;
  height: 11px;
  padding: 0;
  border: 0;
  background: none;
  flex-shrink: 0;

  &__core {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
  }

  // кольца радара
  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    opacity: 0;
  }

  // уходит — кольцо расходится бесконечно
  &--sending {
    color: rgba(255, 255, 255, 0.7);

    &::after {
      animation: radar-ping 1.4s ease-out infinite;
    }
  }

  // дошло — точка и одно статичное кольцо
  &--sent {
    color: rgba(255, 255, 255, 0.85);

    &::before {
      opacity: 0.55;
      transform: scale(0.62);
    }
  }

  // прочитано — два кольца разово расходятся и остаются.
  // циан выбран как самый контрастный к индиго-фиолетовому градиенту пузыря
  &--read {
    color: #5eeaff;

    .status__core {
      box-shadow: 0 0 8px currentColor;
    }

    &::before {
      opacity: 1;
      transform: scale(0.62);
      animation: radar-expand-inner 0.45s ease-out;
    }

    &::after {
      opacity: 0.75;
      animation: radar-expand-outer 0.45s ease-out 0.08s backwards;
    }
  }

  // не ушло — оборванный контур, клик повторяет отправку
  &--failed {
    color: #ff8b8f;
    cursor: pointer;

    &::before {
      opacity: 1;
      border-style: dashed;
    }
  }
}

@keyframes radar-ping {
  from {
    transform: scale(0.35);
    opacity: 0.7;
  }
  to {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes radar-expand-inner {
  from {
    transform: scale(0.2);
    opacity: 0;
  }
  to {
    transform: scale(0.62);
    opacity: 1;
  }
}

@keyframes radar-expand-outer {
  from {
    transform: scale(0.3);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 0.75;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status::before,
  .status::after {
    animation: none !important;
  }
}
</style>
