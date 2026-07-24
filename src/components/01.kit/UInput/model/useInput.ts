import type { ModelRef } from 'vue'

export interface UInputProps {
  label?: string
  placeholder?: string
  type?: 'text' | 'password' | 'email' | 'tel' | 'textarea'
  error?: boolean
  errorMessage?: string
  loading?: boolean
  disabled?: boolean
  icon?: string
}

export type UInputModel = string | number | null

type UInputState = Required<
  Pick<UInputProps, 'type' | 'error' | 'errorMessage' | 'loading' | 'disabled'>
>

export function useInput(
  model: ModelRef<UInputModel>,
  getState: () => UInputState,
) {
  const attrs = useAttrs()
  const state = computed(getState)

  const inputId = computed(
    () => (attrs.id as string) || `u-input-${Math.random().toString(36).slice(2, 7)}`,
  )

  const isDisabled = computed(() => state.value.disabled || state.value.loading)

  const value = computed({
    get: () => model.value,
    set: (val) => {
      if (!isDisabled.value) {
        model.value = val
      }
    },
  })

  const isPasswordVisible = ref(false)

  const togglePasswordVisibility = () => {
    if (!isDisabled.value) {
      isPasswordVisible.value = !isPasswordVisible.value
    }
  }

  const inputType = computed(() => {
    if (state.value.type === 'password') {
      return isPasswordVisible.value ? 'text' : 'password'
    }
    return state.value.type
  })

  const showPasswordToggle = computed(() => state.value.type === 'password')

  const isFilled = computed(() => !!model.value)

  const hasError = computed(() => state.value.error || !!state.value.errorMessage)

  return {
    attrs,
    inputId,
    value,
    isFilled,
    inputType,
    isPasswordVisible,
    showPasswordToggle,
    togglePasswordVisibility,
    hasError,
    isDisabled,
  }
}
