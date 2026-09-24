<script setup lang="ts">
import { useAuthStore } from '@/components/02.features/auth/Authentication/model/auth'
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
