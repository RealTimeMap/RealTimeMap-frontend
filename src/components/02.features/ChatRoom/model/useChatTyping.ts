import type { Ref } from 'vue'
import type { ChatTypingPayload } from '@/components/00.shared/services/chats/index.type'
import { useThrottleFn } from '@vueuse/core'
import { useChatSocket } from '@/components/00.shared/composables/useChatSocket'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

/** Контракт бэкенда: typing.start слать не чаще раза в ~2 секунды, пока идёт набор */
const TYPING_THROTTLE_MS = 2000

interface TypingUser {
  userId: number
  username?: string
}

export function useChatTyping(chatId: Ref<number>) {
  const authStore = useAuthStore()
  const { isConnected, onChatTyping, startTyping, stopTyping } = useChatSocket()

  /** Кто сейчас печатает в этом чате, кроме меня самого */
  const typingUsers = shallowRef<TypingUser[]>([])

  const throttledStart = useThrottleFn(
    () => startTyping({ chatId: chatId.value }),
    TYPING_THROTTLE_MS,
    false,
  )

  /** Дёргать на каждое изменение инпута — троттлинг внутри */
  const notifyTyping = () => throttledStart()

  /** Дёргать на отправку сообщения, очистку поля или уход из чата */
  const notifyStopped = () => stopTyping({ chatId: chatId.value })

  const handleChatTyping = (payload: ChatTypingPayload) => {
    if (payload.chatId !== chatId.value)
      return

    // своё эхо сервер не шлёт, но на всякий случай фильтруем
    if (payload.userId === authStore.user?.userId)
      return

    if (payload.isTyping) {
      const exists = typingUsers.value.some(u => u.userId === payload.userId)
      if (!exists) {
        typingUsers.value = [
          ...typingUsers.value,
          { userId: payload.userId, username: payload.username },
        ]
      }
    }
    else {
      typingUsers.value = typingUsers.value.filter(u => u.userId !== payload.userId)
    }
  }

  let unsubscribe: (() => void) | null = null

  watch(
    isConnected,
    (connected) => {
      unsubscribe?.()
      unsubscribe = null

      if (connected)
        unsubscribe = onChatTyping(handleChatTyping)
    },
    { immediate: true },
  )

  // при смене чата сбрасываем набор и явно шлём stop за собой
  watch(chatId, (_, prevId) => {
    if (prevId !== undefined)
      stopTyping({ chatId: prevId })

    typingUsers.value = []
  })

  onUnmounted(() => {
    unsubscribe?.()
    notifyStopped()
  })

  return {
    typingUsers,
    notifyTyping,
    notifyStopped,
  }
}
