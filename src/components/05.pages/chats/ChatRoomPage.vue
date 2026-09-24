<script lang="ts" setup>
import ChatRoom from '@/components/04.widgets/ChatRoom'

defineProps<{
  chatId: number
}>()
</script>

<template>
  <chat-room :chat-id="chatId" />
</template>
