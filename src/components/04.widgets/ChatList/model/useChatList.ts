import { storeToRefs } from 'pinia'
import { useChatsStore } from '@/components/00.shared/stores/chats'

export function useChatList() {
  const chatsStore = useChatsStore()
  const { chats, isLoading, error } = storeToRefs(chatsStore)

  onMounted(chatsStore.fetchChats)
  onActivated(chatsStore.fetchChats)

  return {
    chats,
    isLoading,
    error,
    fetchChats: chatsStore.fetchChats,
  }
}
