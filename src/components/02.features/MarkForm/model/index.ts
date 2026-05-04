import type { LngLat } from '@yandex/ymaps3-types'
import type { UploadFileInfo } from 'naive-ui'
import type { MarkAddPayload, MarkCreateResponse } from '@/utils/mark/index.type'
import { useMessage } from 'naive-ui'
import { useGeocoding } from '@/composables/useGeocoding'
import { useDialogStore } from '@/shared/stores/dialog'
import { markApi } from '@/utils/mark'

export function useMarkAdd(coords: LngLat) {
  const { address, fetchAddress } = useGeocoding()

  // --- Stores & Hooks ---
  const { close } = useDialogStore()
  const message = useMessage()

  // --- State ---
  const markName = ref('')
  const additionalInfo = ref('')
  const startAt = ref<number | null>(null)

  const selectedCategoryId = ref<number | null>(null)
  const selectedDuration = ref<MarkAddPayload['duration'] | null>(null)
  const fileList = ref<UploadFileInfo[]>([])

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

  const durationOptions = computed(() => {
    return markCreateData.value?.allowedDuration.map(dur => ({
      label: `${dur} ч.`,
      value: dur,
    })) || []
  })

  // --- API ---
  async function fetchCreateData() {
    try {
      isLoadingData.value = true
      const response = await markApi.getMarkCreate()
      markCreateData.value = response

      if (response.allowedDuration.length > 0) {
        selectedDuration.value = response.allowedDuration[0] as MarkAddPayload['duration']
      }

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
    if (!selectedDuration.value) {
      message.warning('Пожалуйста, выберите длительность')
      return
    }

    try {
      isSubmitting.value = true

      const formData = new FormData()

      formData.append('markName', markName.value)
      formData.append('latitude', String(coords[1]))
      formData.append('longitude', String(coords[0]))
      formData.append('categoryId', String(selectedCategoryId.value))
      formData.append('duration', String(selectedDuration.value))

      if (additionalInfo.value) {
        formData.append('additionalInfo', additionalInfo.value)
      }

      if (startAt.value) {
        formData.append('startAt', new Date(startAt.value).toISOString())
      }

      fileList.value.forEach((fileItem) => {
        if (fileItem.file) {
          formData.append('photo', fileItem.file)
        }
      })

      await markApi.postMarkAdd(formData as any)

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
    selectedCategoryId,
    selectedDuration,
    fileList,
    categoryOptions,
    durationOptions,
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
