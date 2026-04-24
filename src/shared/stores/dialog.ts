import type { AllowedComponentProps, Component, VNodeProps } from 'vue'

type ComponentProps<C extends Component> = C extends new (...args: any) => any
  ? Omit<InstanceType<C>['$props'], keyof VNodeProps | keyof AllowedComponentProps>
  : never

export type TransitionType = 'slide-up' | 'slide-left' | 'scale'

export interface DialogOptions {
  title?: string
  width?: string
  height?: string
  classModal?: string
  closeable?: boolean
  closeOnOverlayClick?: boolean
  transition?: TransitionType
  position?: 'center' | 'right' | 'left' | 'flex-end'
}

export const useDialogStore = defineStore('dialog', () => {
  const activeDialog = shallowRef<{
    component: Component
    props?: ComponentProps<Component>
    options: Required<DialogOptions>
  } | null>(null)

  const isVisible = ref(false)

  const defaultOptions: Required<DialogOptions> = {
    title: '',
    height: 'auto',
    width: '500px',
    classModal: '',
    closeable: true,
    closeOnOverlayClick: true,
    transition: 'slide-up',
    position: 'center',
  }

  function open<C extends Component>(
    component: C,
    props?: ComponentProps<C>,
    options: DialogOptions = {},
  ): void {
    activeDialog.value = {
      component,
      props,
      options: { ...defaultOptions, ...options },
    }
    isVisible.value = true
  }

  function close() {
    isVisible.value = false
  }

  function destroy() {
    activeDialog.value = null
  }

  return {
    activeDialog,
    isVisible,
    open,
    close,
    destroy,
  }
})
