<script lang="ts" setup>
import { useProfileNavigation } from '@/components/00.shared/composables/useProfileNavigation'

const props = defineProps<{
  title: string
  avatar?: string
  statusText?: string
  isOnline?: boolean
  isTyping?: boolean
  userId?: number
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const { openProfile } = useProfileNavigation()

function goToProfile() {
  if (props.userId != null)
    openProfile(props.userId, { username: props.title, avatar: props.avatar })
}
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
      :class="{ 'chat-header__wrapper--clickable': userId != null }"
      @click="goToProfile"
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
        <div class="chat-header__name">
          <span class="title">{{ title }}</span>
          <u-admin-badge
            v-if="isAdmin"
            class="chat-header__badge"
            :size="14"
          />
        </div>
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
    background: var(--surface-subtle);
  }

  &__wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;

    &--clickable {
      cursor: pointer;
    }
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
    border: 2px solid var(--bg-color-block);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;

    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
      font-size: 16px;
      min-width: 0;
    }
  }

  &__badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
