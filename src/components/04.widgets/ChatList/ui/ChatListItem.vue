<script lang="ts" setup>
import type { Chat } from '@/components/00.shared/services/chats/index.type'
import { formatChatTimestamp } from '@/components/00.shared/lib/date/FormatDate'
import { hapticMedium } from '@/components/00.shared/lib/haptics'
import { peerReadFrom } from '@/components/00.shared/services/chats/readCursors'
import { useAuthStore } from '@/components/00.shared/stores/auth'
import { useChatsStore } from '@/components/00.shared/stores/chats'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { openRow } from '../model/openRow'
import ChatActions from './ChatActions.vue'
import ChatContextMenu from './ChatContextMenu.vue'

const props = defineProps<{
  chat: Chat
}>()

const chatsStore = useChatsStore()

const authStore = useAuthStore()

const isOnline = computed(() => chatsStore.isPeerOnline(props.chat.peerId))

const ownStatus = computed(() => {
  const last = props.chat.lastMessage
  const me = authStore.user
  if (!last || !me || last.username !== me.username)
    return null
  return last.messageId <= peerReadFrom(props.chat.readCursors, me.userId) ? 'read' : 'sent'
})

// --- Свайп влево открывает кнопки, удержание — меню действий ---
/** Кнопка и зазор перед ней: последняя кнопка стоит вровень с правым краем списка */
const BUTTON_SIZE = 46
const BUTTON_GAP = 8
const ACTION_WIDTH = BUTTON_SIZE + BUTTON_GAP
const LONG_PRESS_MS = 500
/** Дальше этого палец ушёл — это уже жест, а не нажатие */
const MOVE_PX = 10

const dialog = useDialogStore()

const openChatId = openRow

const hasUnread = computed(() => props.chat.unreadCount > 0)
const actionsWidth = computed(() => ACTION_WIDTH * (hasUnread.value ? 2 : 1))
const offset = ref(0)
const dragging = ref(false)
const isOpen = computed(() => openChatId.value === props.chat.chatId)

watch(isOpen, (open) => {
  if (!open)
    offset.value = 0
})

let start: { x: number, y: number, base: number } | null = null
let horizontal = false
let suppressClick = false
let pressTimer: ReturnType<typeof setTimeout> | undefined

const menuSource = shallowRef<HTMLElement | null>(null)

function confirmDelete() {
  openChatId.value = null
  menuSource.value = null
  dialog.open(ChatActions, { chat: props.chat }, { position: 'end center', headerModal: false })
}

const rowEl = useTemplateRef<{ $el: HTMLElement }>('row')

function openMenu() {
  openChatId.value = null
  const el = rowEl.value?.$el
  if (el)
    menuSource.value = el
}

function onDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0)
    return
  start = { x: event.clientX, y: event.clientY, base: offset.value }
  horizontal = false
  suppressClick = false
  clearTimeout(pressTimer)
  pressTimer = setTimeout(() => {
    start = null
    suppressClick = true
    void hapticMedium()
    openMenu()
  }, LONG_PRESS_MS)
}

function onMove(event: PointerEvent) {
  if (!start)
    return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (!horizontal) {
    if (Math.abs(dx) < MOVE_PX && Math.abs(dy) < MOVE_PX)
      return
    clearTimeout(pressTimer)
    if (Math.abs(dy) >= Math.abs(dx)) {
      start = null
      return
    }
    horizontal = true
    dragging.value = true
    openChatId.value = props.chat.chatId
  }
  offset.value = Math.min(0, Math.max(-actionsWidth.value - 24, start.base + dx))
}

function onUp() {
  clearTimeout(pressTimer)
  if (horizontal) {
    suppressClick = true
    const open = offset.value < -actionsWidth.value / 2
    offset.value = open ? -actionsWidth.value : 0
    if (!open && openChatId.value === props.chat.chatId)
      openChatId.value = null
  }
  dragging.value = false
  start = null
  horizontal = false
}

function onClick(event: MouseEvent) {
  if (!suppressClick && !isOpen.value)
    return
  event.preventDefault()
  event.stopPropagation()
  if (suppressClick)
    suppressClick = false
  else
    openChatId.value = null
}

function read() {
  openChatId.value = null
  menuSource.value = null
  void chatsStore.readChat(props.chat.chatId)
}

onBeforeUnmount(() => clearTimeout(pressTimer))
</script>

<template>
  <div
    class="chat-swipe"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @contextmenu.prevent="openMenu"
  >
    <div
      class="chat-swipe__actions"
      :style="{ width: `${-offset}px` }"
    >
      <div
        class="chat-swipe__buttons"
        :style="{ width: `${actionsWidth}px` }"
      >
        <button
          v-if="hasUnread"
          class="chat-swipe__action chat-swipe__action--read"
          type="button"
          aria-label="Прочитано"
          @pointerdown.stop
          @click="read"
        >
          <span class="chat-swipe__circle">
            <u-icon
              icon="app:check"
              width="22"
            />
          </span>
        </button>
        <button
          class="chat-swipe__action chat-swipe__action--delete"
          type="button"
          aria-label="Удалить"
          @pointerdown.stop
          @click="confirmDelete"
        >
          <span class="chat-swipe__circle">
            <u-icon
              icon="app:trash"
              width="22"
            />
          </span>
        </button>
      </div>
    </div>

    <router-link
      ref="row"
      class="chat"
      :class="{ 'chat--dragging': dragging, 'chat--shifted': offset < 0 }"
      :style="{ transform: offset ? `translateX(${offset}px)` : undefined }"
      draggable="false"
      :to="{
        name: 'chat-room',
        params: {
          chatId: chat.chatId,
        },
      }"
      @click.capture="onClick"
    >
      <div class="chat-avatar">
        <u-avatar
          :size="52"
          rounded
          :src="chat.avatar || undefined"
          :alt-text="chat.title"
        />
        <span
          v-if="isOnline"
          class="chat-avatar__dot"
        />
      </div>
      <div class="chat-content">
        <div class="chat-row">
          <div class="chat-name">
            <span class="chat-name__text">
              {{ chat.title }}
            </span>
            <u-admin-badge
              v-if="chat.isAdmin"
              class="chat-name__badge"
              :size="14"
            />
          </div>
          <span class="time">
            <span
              v-if="ownStatus"
              class="status"
              :class="`status--${ownStatus}`"
              role="img"
              :aria-label="ownStatus === 'read' ? 'Прочитано' : 'Отправлено'"
            >
              <u-icon
                icon="app:check"
                width="14"
              />
              <u-icon
                v-if="ownStatus === 'read'"
                class="status__second"
                icon="app:check"
                width="14"
              />
            </span>
            {{ formatChatTimestamp(chat.updatedAt) }}
          </span>
        </div>
        <div class="chat-row">
          <span class="content">{{ chat.lastMessage?.content }}</span>
          <u-badge :count="chat.unreadCount" />
        </div>
      </div>
    </router-link>

    <chat-context-menu
      v-if="menuSource"
      :source="menuSource"
      :has-unread="hasUnread"
      @close="menuSource = null"
      @read="read"
      @remove="confirmDelete"
    />
  </div>
</template>

<style lang="scss" scoped>
.chat-swipe {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-touch-callout: none;

  &__actions {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
  }

  &__buttons {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  &__action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: none;
    background: none;
    @include value-text(13px, var(--text-color), 500);
    cursor: pointer;

    &:active .chat-swipe__circle {
      transform: scale(0.92);
    }

    &--read .chat-swipe__circle {
      background: var(--primary-color);
    }

    &--delete .chat-swipe__circle {
      background: var(--red-color);
    }
  }

  &__circle {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 14px;
    color: #fff;
    transition: transform 0.12s ease;
  }
}

.chat--dragging {
  transition: none !important;
}

.chat--shifted {
  border-radius: 0 18px 18px 0;
}

.status {
  display: inline-flex;
  color: var(--text-color-muted);

  &--read {
    color: var(--primary-color);
  }

  &__second {
    margin-left: -9px;
  }
}

.chat {
  position: relative;
  display: flex;
  width: 100%;
  background: var(--bg-body);
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.2s ease,
    background 0.2s ease;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
  border-bottom: 0.5px solid var(--border-subtle);
  text-decoration: none;
  color: inherit;

  &-avatar {
    position: relative;
    flex-shrink: 0;
    line-height: 0;

    &__dot {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--access-color);
      border: 2px solid var(--bg-color-block);
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;

    .chat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }

    .chat-name {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;

      &__text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
        font-size: 16px;
        min-width: 0;
      }

      &__badge {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    }

    .content {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      @include label-text(14px, none);
    }

    .time {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 3px;
      @include label-text(12px, none);
      white-space: nowrap;
    }
  }
}
</style>
