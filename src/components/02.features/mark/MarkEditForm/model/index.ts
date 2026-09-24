import type { MarkCategory, MarkFull } from '@/components/00.shared/services/mark/index.type'
import { hapticSuccess } from '@/components/00.shared/lib/haptics'
import { markApi } from '@/components/00.shared/services/mark'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

export function useMarkEdit(mark: MarkFull, onSaved?: () => void) {
  const { close } = useDialogStore()
  const notify = useNotificationStore()

  // --- State (prefilled) ---
  const markName = ref(mark.markName)
  const additionalInfo = ref(mark.additionalInfo ?? '')
  const selectedCategoryId = ref<number | null>(mark.category?.id ?? null)

  const existingPhotos = ref<string[]>([...(mark.photos ?? [])])
  const photosToDelete = ref<string[]>([])
  const fileList = ref<File[]>([])

  const markCreateData = ref<MarkCategory[]>()
  const isLoadingData = ref(false)
  const isSubmitting = ref(false)

  const categoryOptions = computed(() => {
    return markCreateData.value?.map(cat => ({
      icon: cat.icon,
      color: cat.color,
      label: cat.categoryName,
      value: cat.id,
    })) || []
  })

  async function fetchCreateData() {
    try {
      isLoadingData.value = true
      markCreateData.value = await markApi.getMarkCreate()
    }
    catch (err) {
      console.error('Error fetching categories:', err)
      notify.add({
        title: 'Нет категорий',
        description: 'Не удалось загрузить списки категорий',
        type: 'error',
      })
    }
    finally {
      isLoadingData.value = false
    }
  }

  function removeExistingPhoto(url: string) {
    existingPhotos.value = existingPhotos.value.filter(p => p !== url)
    if (!photosToDelete.value.includes(url))
      photosToDelete.value.push(url)
  }

  async function handleSubmit() {
    if (!markName.value.trim()) {
      notify.add({ title: 'Внимание', description: 'Введите название метки', type: 'warning' })
      return
    }
    if (!selectedCategoryId.value) {
      notify.add({ title: 'Внимание', description: 'Выберите категорию', type: 'warning' })
      return
    }

    try {
      isSubmitting.value = true

      const formData = new FormData()
      formData.append('markName', markName.value.trim())
      formData.append('additionalInfo', additionalInfo.value || '')
      formData.append('categoryId', selectedCategoryId.value.toString())

      fileList.value.forEach((file) => {
        formData.append('photos', file)
      })

      photosToDelete.value.forEach((url) => {
        formData.append('photosToDelete', url)
      })

      await markApi.updateMark(mark.id, formData)

      hapticSuccess()
      notify.add({
        title: 'Метка обновлена',
        description: 'Изменения сохранены',
        type: 'success',
      })
      onSaved?.()
      close()
    }
    catch (e) {
      console.error(e)
      notify.add({
        title: 'Не удалось сохранить',
        description: 'Проверьте соединение и попробуйте снова',
        type: 'error',
      })
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    markName,
    additionalInfo,
    selectedCategoryId,
    existingPhotos,
    photosToDelete,
    fileList,
    categoryOptions,
    isLoadingData,
    isSubmitting,
    // func
    fetchCreateData,
    removeExistingPhoto,
    handleSubmit,
    close,
  }
}
