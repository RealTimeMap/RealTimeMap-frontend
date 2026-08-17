<script lang="ts" setup>
defineProps<{
  isSending: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string): void
  (e: 'attach'): void
  (e: 'typing'): void
  (e: 'stopTyping'): void
}>()

const MAX_HEIGHT = 120

const text = ref('')
const textareaEl = useTemplateRef<HTMLTextAreaElement>('textarea')

const canSend = computed(() => text.value.trim().length > 0)

function autoGrow() {
  const el = textareaEl.value
  if (!el)
    return

  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
}

function handleInput() {
  autoGrow()

  if (text.value.trim().length > 0)
    emit('typing')
  else
    emit('stopTyping')
}

function handleSend() {
  if (!canSend.value)
    return

  emit('send', text.value)
  emit('stopTyping')
  text.value = ''
  nextTick(autoGrow)
}

function handleKeydown(event: KeyboardEvent) {
  const isTouch = 'ontouchstart' in window

  if (event.key === 'Enter' && !event.shiftKey && !isTouch) {
    event.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="composer">
    <!-- <button
      type="button"
      class="composer__attach"
      aria-label="Прикрепить файл"
      @click="emit('attach')"
    >
      <u-icon
        icon="lucide:plus"
        width="22"
      />
    </button> -->

    <div class="composer__field">
      <textarea
        ref="textarea"
        v-model="text"
        rows="1"
        placeholder="Сообщение..."
        class="composer__input"
        @input="handleInput"
        @keydown="handleKeydown"
      />

      <button
        type="button"
        class="composer__send"
        :class="{ 'composer__send--active': canSend }"
        :disabled="!canSend || isSending"
        aria-label="Отправить"
        @click="handleSend"
      >
        <u-icon
          icon="lucide:send-horizontal"
          width="18"
        />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.composer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 16px calc(20px + var(--safe-bottom));

  &__attach {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: var(--text-color);
    background: rgba(255, 255, 255, 0.08);
  }

  &__field {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    @include glass-panel(24px, 6px 6px 6px 14px);
  }

  &__input {
    flex: 1;
    padding: 9px 0;
    border: none;
    outline: none;
    resize: none;
    max-height: 120px;
    font-family: inherit;
    font-size: 15px;
    line-height: 1.35;
    color: var(--text-color);
    background: transparent;

    &::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
  }

  &__send {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.08);
    transition:
      background 0.2s ease,
      color 0.2s ease;

    &--active {
      color: #fff;
      background: linear-gradient(120deg, #4a5bf7 0%, #8b3df0 100%);
    }

    &:disabled {
      cursor: default;
    }
  }
}
</style>
