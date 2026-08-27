import type { AllowedComponentProps, Component, VNodeProps } from 'vue'

type ComponentProps<C extends Component> = C extends new (...args: any) => any
  ? Omit<InstanceType<C>['$props'], keyof VNodeProps | keyof AllowedComponentProps>
  : never

export type TransitionType = 'slide-up' | 'slide-right' | 'scale'
export type DialogPosition
  = | 'center'
    | 'center end' // справа, по центру вертикали
    | 'center start' // слева, по центру вертикали
    | 'end center' // снизу, по центру горизонтали
    | 'start center' // сверху, по центру горизонтали

export interface DialogOptions {
  title?: string
  headerModal?: boolean
  width?: string
  height?: string
  classModal?: string
  closeable?: boolean
  closeOnOverlayClick?: boolean
  transition?: TransitionType
  position?: DialogPosition
  swipeable?: boolean
  onClose?: () => void
}

export const useDialogStore = defineStore('dialog', () => {
  const dialogs = shallowRef<{
    id: string
    component: Component
    props?: ComponentProps<Component>
    options: Required<DialogOptions>
  }[]>([])

  const isVisible = ref(false)

  const defaultOptions: Required<DialogOptions> = {
    title: '',
    headerModal: true,
    height: 'auto',
    width: '500px',
    classModal: '',
    closeable: true,
    closeOnOverlayClick: true,
    transition: 'slide-up',
    position: 'center',
    swipeable: true,
    onClose: () => { },
  }

  function open<C extends Component>(
    component: C,
    props?: ComponentProps<C>,
    options: DialogOptions = {},
  ): void {
    const id = Math.random().toString(36).substring(2, 9)

    dialogs.value = [
      ...dialogs.value,
      {
        id,
        component,
        props,
        options: { ...defaultOptions, ...options },
      },
    ]
  }

  function close() {
    const topDialog = dialogs.value[dialogs.value.length - 1]

    if (topDialog?.options.onClose) {
      topDialog.options.onClose()
    }
    dialogs.value = dialogs.value.slice(0, -1)
  }

  function destroy() {
    dialogs.value = []
  }

  const hasDialogs = computed(() => dialogs.value.length > 0)

  return {
    dialogs,
    hasDialogs,
    isVisible,
    open,
    close,
    destroy,
  }
})
