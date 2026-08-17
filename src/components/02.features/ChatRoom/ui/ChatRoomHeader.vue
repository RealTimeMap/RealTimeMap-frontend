<script lang="ts" setup>
import { useProfileNavigation } from '@/components/00.shared/composables/useProfileNavigation'

defineProps<{
  title: string
  avatar?: string
  statusText?: string
  isOnline?: boolean
  isTyping?: boolean
  userId: number
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const { openProfile } = useProfileNavigation()
</script>

<template>
  <header class="chat-header">
    <button
      type="button"
      class="chat-header__back"
      aria-label="Назад"
      @click="emit('back')"
    >
      <u-icon
        icon="lucide:chevron-left"
        width="22"
      />
    </button>

    <div
      class="chat-header__wrapper"
      @click="openProfile(userId)"
    >
      <div class="chat-header__avatar">
        <u-avatar
          :size="42"
          rounded
          :src="avatar"
          :alt-text="title"
        />
        <span
          v-if="isOnline"
          class="chat-header__dot"
        />
      </div>

      <div class="chat-header__info">
        <span class="chat-header__title">{{ title }}</span>
        <span
          v-if="statusText"
          class="chat-header__status"
          :class="{ 'chat-header__status--typing': isTyping }"
        >
          {{ statusText }}
        </span>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding: calc(12px + var(--safe-top)) 16px 12px;

  &__back {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: var(--text-color);
    background: rgba(255, 255, 255, 0.08);
  }

  &__wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__avatar {
    position: relative;
    flex-shrink: 0;
    line-height: 0;
  }

  &__dot {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--access-color);
    border: 2px solid #0b0b10;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status {
    font-size: 13px;
    color: var(--primary-color);

    &--typing {
      color: var(--primary-color);
      font-style: italic;
    }
  }
}
</style>
