<script setup lang="ts">
import { useAuthStore } from '@/components/00.shared/stores/auth'
import profileUserView from '@/components/04.widgets/Profile'

const emit = defineEmits<{
  (e: 'colorExtracted', color: string): void
}>()

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
</script>

<template>
  <profile-user-view
    :user="user"
    is-own
    @color-extracted="(color) => emit('colorExtracted', color)"
  />
</template>
