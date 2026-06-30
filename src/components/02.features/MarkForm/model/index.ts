import type { MapPoint } from '@/types/shared/map'
import type { MarkAddPayload, MarkCreateResponse } from '@/utils/mark/index.type'
import { useGeocoding } from '@/composables/useGeocoding'
import { useDialogStore } from '@/shared/stores/dialog'
import { useNotificationStore } from '@/shared/stores/notification'
import { markApi } from '@/utils/mark'

export function useMarkAdd(coords: MapPoint) {
  const { address, fetchAddress } = useGeocoding()

  // --- Stores & Hooks ---
  const { close } = useDialogStore()
  const notify = useNotificationStore()

  // --- State ---
  const markName = ref('')
  const additionalInfo = ref('')

  const startAt = ref<Date>(new Date())
  const endAt = ref<Date | null>(null)

  const selectedCategoryId = ref<number | null>(null)
  const fileList = ref<File[]>([])

  const markCreateData = ref<MarkCreateResponse>()
  const isLoadingData = ref(false)
  const isSubmitting = ref(false)

  // --- Computed Options для NSelect ---
  const categoryOptions = computed(() => {
    return markCreateData.value?.allowedCategories.map(cat => ({
      icon: cat.icon,
      color: cat.color,
      label: cat.categoryName,
      value: cat.id,
    })) || []
  })

  // --- API ---
  async function fetchCreateData() {
    try {
      isLoadingData.value = true
      const response = await markApi.getMarkCreate()
      markCreateData.value = response

      if (response.allowedCategories.length > 0) {
        selectedCategoryId.value = response.allowedCategories[0].id
      }
    }
    catch (err) {
      console.error('Error fetching mark creation data:', err)
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

  // --- Handlers ---
  async function handleSubmit() {
    if (!coords) {
      notify.add({
        title: 'Ошибка',
        description: 'Координаты не определены',
        type: 'error',
      })
      return
    }

    if (!markName.value) {
      notify.add({
        title: 'Внимание',
        description: 'Введите название метки',
        type: 'warning',
      })
      return
    }

    if (!selectedCategoryId.value) {
      notify.add({
        title: 'Внимание',
        description: 'Выберите категорию',
        type: 'warning',
      })
      return
    }

    try {
      isSubmitting.value = true

      const formData = new FormData()

      type SimpleFields = Omit<MarkAddPayload, 'photo'>

      const payload: Partial<Record<keyof SimpleFields, string>> = {
        markName: markName.value,
        latitude: coords[1].toString(),
        longitude: coords[0].toString(),
        categoryId: selectedCategoryId.value.toString(),
        startAt: startAt.value.toISOString(),
        endAt: endAt.value?.toISOString(),
        additionalInfo: additionalInfo.value || '',
      }

      Object.entries(payload).forEach(([key, value]) => {
        if (value)
          formData.append(key, value)
      })

      if (fileList.value.length > 0) {
        fileList.value.forEach((file) => {
          formData.append('photos', file)
        })
      }

      await markApi.postMarkAdd(formData)

      notify.add({
        title: 'Метка опубликована',
        description: 'Ваша история теперь видна всем пользователям на карте',
        type: 'success',
      })
      close()
    }
    catch (e) {
      console.error(e)
      notify.add({
        title: 'Не удалось создать метку',
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
    startAt,
    endAt,
    selectedCategoryId,
    fileList,
    categoryOptions,
    isLoadingData,
    isSubmitting,
    address,
    // func
    handleSubmit,
    close,
    fetchCreateData,
    fetchAddress,
  }
}
