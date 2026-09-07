<script setup lang="ts">
import type { User } from '@/components/00.shared/services/user/index.type'
import { userApi } from '@/components/00.shared/services/user'
import { useProfilePreviewStore } from '@/components/00.shared/stores/profilePreview'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import profileUserView from '@/components/02.features/Profile'

const { userId } = defineProps<{
  userId: number
}>()

const emit = defineEmits<{
  (e: 'colorExtracted', color: string): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const previewStore = useProfilePreviewStore()
const user = ref<User | null>(null)
const error = ref<string | null>(null)

function seedFromPreview(id: number) {
  const preview = previewStore.getPreview(id)
  user.value = {
    userId: id,
    username: preview?.username ?? '',
    avatar: preview?.avatar,
    tag: preview?.tag ?? '',
  } as User
}

async function fetchUser() {
  try {
    const userData = await userApi.getProfileById(userId)
    user.value = userData
  }
  catch (err: any) {
    error.value = err
  }
}

const isOwnProfile = computed(() => authStore.user?.userId === userId)

watch(isOwnProfile, (isOwn) => {
  if (isOwn)
    router.replace({ name: 'profile' })
}, { immediate: true })

watch(() => userId, (id) => {
  if (isOwnProfile.value)
    return

  seedFromPreview(id)
  fetchUser()
}, { immediate: true })
</script>

<template>
  <profile-user-view
    :user="user"
    @color-extracted="(color) => emit('colorExtracted', color)"
  />
</template>
