<script lang="ts" setup>
import ChatRoom from '@/components/02.features/ChatRoom'

defineProps<{
  chatId: number
}>()
</script>

<template>
  <chat-room :chat-id="chatId" />
</template>
