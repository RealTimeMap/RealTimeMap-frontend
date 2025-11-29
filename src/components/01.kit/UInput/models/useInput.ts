export interface UInputProps {
  modelValue: string | number | null
  label?: string
  type?: 'text' | 'password' | 'email' | 'tel' | 'textarea'
  error?: boolean
  errorMessage?: string
  loading?: boolean
  disabled?: boolean
}

export function useInput(
  props: UInputProps,
  emit: (event: 'update:modelValue', ...args: any[]) => void,
) {
  const attrs = useAttrs()

  const inputId = computed(
    () => (attrs.id as string) || `u-input-${Math.random().toString(36).slice(2, 7)}`,
  )

  const value = computed({
    get: () => props.modelValue,
    set: (val) => {
      if (!props.disabled && !props.loading) {
        emit('update:modelValue', val)
      }
    },
  })

  const isPasswordVisible = ref(false)

  const togglePasswordVisibility = () => {
    if (!props.disabled && !props.loading) {
      isPasswordVisible.value = !isPasswordVisible.value
    }
  }

  const inputType = computed(() => {
    if (props.type === 'password') {
      return isPasswordVisible.value ? 'text' : 'password'
    }
    return props.type || 'text'
  })

  const showPasswordToggle = computed(() => props.type === 'password')

  const isFilled = computed(() => !!props.modelValue)

  const hasError = computed(() => props.error || !!props.errorMessage)

  const isDisabled = computed(() => props.disabled || props.loading)

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
