import type { ApiError } from '@/components/00.shared/api/api.types'
import type { BugTag } from '@/components/00.shared/services/bug/index.type'
import { onBugError } from '@/components/00.shared/lib/bugLogger'
import router from '@/components/00.shared/lib/router'
import { bugApi } from '@/components/00.shared/services/bug'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import BugReportModal from '../ui/BugReportModal.vue'
import { collectBugContext } from './context'

export interface BugPrefill {
  title?: string
  desc?: string
  tag?: BugTag
}

export function openBugReport(prefill: BugPrefill = {}): void {
  const dialog = useDialogStore()
  dialog.open(BugReportModal, { prefill }, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}

export async function submitBug(
  input: {
    title: string
    desc: string
    tag: BugTag
  },
): Promise<boolean> {
  const dialog = useDialogStore()
  const notify = useNotificationStore()

  try {
    const { device, app } = await collectBugContext()
    await bugApi.create({ ...input, device, app })
    notify.add({ title: 'Спасибо! Баг отправлен', type: 'success' })
    dialog.close()
    return true
  }
  catch (e) {
    const status = (e as ApiError)?.status
    if (status === 409)
      notify.add({ title: 'Об этом баге уже сообщили', type: 'info' })
    else if (status === 422)
      notify.add({ title: 'Проверьте заголовок и описание', type: 'warning' })
    else
      notify.add({ title: 'Не удалось отправить баг', type: 'error' })
    return false
  }
}

export function initBugReport(): void {
  let toastShown = false
  const notify = useNotificationStore()
  const SILENCED_ROUTES = new Set(['login'])

  onBugError(async (info) => {
    if (SILENCED_ROUTES.has(String(router.currentRoute.value.name)))
      return
    if (toastShown)
      return
    toastShown = true

    const toastId = await notify.add({
      title: 'Что-то пошло не так',
      description: 'Помогите нам починить это',
      type: 'error',
      duration: 0,
      action: {
        text: 'Сообщить о баге',
        callback: () => {
          if (toastId)
            notify.remove(toastId)
          openBugReport({ tag: 'logic', title: info.message.slice(0, 120) })
        },
      },
    })
  })
}
