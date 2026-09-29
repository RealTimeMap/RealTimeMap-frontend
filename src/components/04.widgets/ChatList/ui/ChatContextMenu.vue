<script setup lang="ts">
const props = defineProps<{
  source: HTMLElement
  hasUnread: boolean
}>()

const emit = defineEmits<{
  close: []
  read: []
  remove: []
}>()

const MENU_WIDTH = 230
const MENU_ITEM_HEIGHT = 46
const GAP = 8
const EDGE = 12
const PREVIEW_PAD = 10

const rect = props.source.getBoundingClientRect()
const preview = useTemplateRef<HTMLElement>('preview')

const menuHeight = computed(() => MENU_ITEM_HEIGHT * (props.hasUnread ? 2 : 1))
const below = rect.bottom + GAP + menuHeight.value + EDGE < window.innerHeight
const menuStyle = computed(() => ({
  width: `${MENU_WIDTH}px`,
  left: `${Math.max(EDGE, rect.right - MENU_WIDTH)}px`,
  top: below ? `${rect.bottom + GAP}px` : `${rect.top - GAP - menuHeight.value}px`,
  transformOrigin: below ? 'top right' : 'bottom right',
}))

onMounted(() => {
  const clone = props.source.cloneNode(true) as HTMLElement
  clone.style.transform = ''
  clone.removeAttribute('href')
  preview.value?.append(clone)
})

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape')
    emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <teleport to="body">
    <div
      class="chat-menu"
      @click.self="emit('close')"
      @contextmenu.prevent="emit('close')"
    >
      <div
        ref="preview"
        class="chat-menu__preview"
        :style="{
          left: `${rect.left - PREVIEW_PAD}px`,
          top: `${rect.top}px`,
          width: `${rect.width + PREVIEW_PAD * 2}px`,
          height: `${rect.height}px`,
        }"
        @click="emit('close')"
      />

      <div
        class="chat-menu__list"
        :style="menuStyle"
        role="menu"
      >
        <button
          v-if="hasUnread"
          class="chat-menu__item"
          type="button"
          role="menuitem"
          @click="emit('read')"
        >
          Отметить прочитанным
          <u-icon
            icon="app:check"
            width="18"
          />
        </button>
        <button
          class="chat-menu__item chat-menu__item--danger"
          type="button"
          role="menuitem"
          @click="emit('remove')"
        >
          Удалить
          <u-icon
            icon="app:trash"
            width="18"
          />
        </button>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.chat-menu {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgb(0 0 0 / 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: chat-menu-fade 0.18s ease both;

  &__preview {
    position: fixed;
    box-sizing: border-box;
    padding-inline: 10px;
    border-radius: 16px;
    background: var(--bg-body);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
    overflow: hidden;
    animation: chat-menu-lift 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) both;

    :deep(.chat) {
      border-bottom-color: transparent;
      pointer-events: none;
    }
  }

  &__list {
    position: fixed;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
    background: var(--bg-block-solid, var(--bg-color-block));
    box-shadow: 0 12px 32px rgb(0 0 0 / 0.2);
    animation: chat-menu-pop 0.2s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 46px;
    padding: 0 16px;
    border: none;
    background: none;
    @include value-text(15px, var(--text-color), 500);
    text-align: left;
    cursor: pointer;

    & + & {
      border-top: 0.5px solid var(--border-subtle);
    }

    &:active {
      background: var(--surface-subtle);
    }

    &--danger {
      color: var(--red-color);
    }
  }
}

@keyframes chat-menu-fade {
  from {
    opacity: 0;
  }
}

@keyframes chat-menu-lift {
  from {
    transform: scale(1);
    box-shadow: none;
  }
  50% {
    transform: scale(1.03);
  }
  to {
    transform: scale(1.01);
  }
}

@keyframes chat-menu-pop {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-menu,
  .chat-menu__preview,
  .chat-menu__list {
    animation: none;
  }
}
</style>
