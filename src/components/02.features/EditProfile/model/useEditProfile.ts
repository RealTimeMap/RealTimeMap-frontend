import type { ApiError } from '@/components/00.shared/api/api.types'
import type { User } from '@/components/00.shared/services/user/index.type'
import { userApi } from '@/components/00.shared/services/user'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

export function useEditProfile(user: User) {
  const authStore = useAuthStore()
  const dialog = useDialogStore()
  const notifications = useNotificationStore()

  const username = ref(user.username ?? '')
  const tag = ref((user.tag ?? '').replace(/^@\s*/, ''))
  const avatarFile = ref<File | null>(null)
  const avatarPreview = ref<string | null>(null)
  const isSaving = ref(false)
  const usernameError = ref('')
  const tagError = ref('')

  const avatarSrc = computed(() => avatarPreview.value ?? user.avatar)

  const MAX_AVATAR_MB = 5

  function selectAvatar(file: File) {
    if (!file.type.startsWith('image/')) {
      notifications.add({ title: 'Нужен файл изображения', type: 'error' })
      return
    }
    if (file.size / 1024 / 1024 > MAX_AVATAR_MB) {
      notifications.add({ title: `Изображение больше ${MAX_AVATAR_MB} МБ`, type: 'error' })
      return
    }

    avatarFile.value = file
    if (avatarPreview.value)
      URL.revokeObjectURL(avatarPreview.value)
    avatarPreview.value = URL.createObjectURL(file)
  }

  function dispose() {
    if (avatarPreview.value)
      URL.revokeObjectURL(avatarPreview.value)
  }

  const USERNAME_MIN = 2
  const USERNAME_MAX = 32

  function validate(): boolean {
    usernameError.value = ''
    tagError.value = ''

    const name = username.value.trim()
    if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) {
      usernameError.value = `Имя должно быть от ${USERNAME_MIN} до ${USERNAME_MAX} символов`
      return false
    }

    return true
  }

  async function save() {
    if (isSaving.value || !validate())
      return

    isSaving.value = true

    try {
      const updated = await userApi.updateProfile({
        username: username.value.trim(),
        tag: tag.value.trim(),
        avatar: avatarFile.value ?? undefined,
      })

      await authStore.setUser({ ...user, ...updated })

      notifications.add({ title: 'Профиль обновлён', type: 'success' })
      dialog.close()
    }
    catch (error) {
      const err = error as ApiError
      if (err.status === 409) {
        tagError.value = 'Такой никнейм уже занят'
      }
      else {
        notifications.add({
          title: 'Не удалось сохранить профиль',
          description: err.message,
          type: 'error',
        })
      }
    }
    finally {
      isSaving.value = false
    }
  }

  return {
    username,
    tag,
    avatarSrc,
    isSaving,
    usernameError,
    tagError,
    selectAvatar,
    save,
    dispose,
  }
}
