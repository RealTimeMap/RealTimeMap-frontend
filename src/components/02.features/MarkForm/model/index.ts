import type { MapPoint } from '@/types/shared/map'
import type { MarkAddPayload, MarkCreateResponse } from '@/utils/mark/index.type'
import { useMessage } from 'naive-ui'
import { useGeocoding } from '@/composables/useGeocoding'
import { useDialogStore } from '@/shared/stores/dialog'
import { markApi } from '@/utils/mark'

export function useMarkAdd(coords: MapPoint) {
  const { address, fetchAddress } = useGeocoding()

  // --- Stores & Hooks ---
  const { close } = useDialogStore()
  const message = useMessage()

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
      message.error('Не удалось загрузить списки категорий')
    }
    finally {
      isLoadingData.value = false
    }
  }

  // --- Handlers ---
  async function handleSubmit() {
    if (!coords) {
      message.error('Координаты метки не найдены')
      return
    }

    if (!markName.value) {
      message.warning('Пожалуйста, введите название метки')
      return
    }
    if (!selectedCategoryId.value) {
      message.warning('Пожалуйста, выберите категорию')
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

      message.success('Метка успешно создана')
      close()
    }
    catch (e) {
      console.error(e)
      message.error('Ошибка при создании метки')
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
