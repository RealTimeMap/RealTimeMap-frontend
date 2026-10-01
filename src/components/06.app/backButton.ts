import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import router from '@/components/00.shared/lib/router'
import { useDialogStore } from '@/components/00.shared/stores/dialog'

export function setupBackButton() {
  if (!Capacitor.isNativePlatform()) {
    setupWebBack()
    return
  }

  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const dialog = useDialogStore()

    if (dialog.hasDialogs) {
      dialog.close()
      return
    }

    if (canGoBack)
      router.back()
    else
      CapacitorApp.exitApp()
  })
}

// --- Назад в браузере и PWA: свайп от края на iPhone, жест «назад» на Android ---
// Открытая модалка кладёт в историю пустую запись с тем же адресом. «Назад» снимает её —
// и мы закрываем верхнюю модалку, а не уходим со страницы

const DIALOG_MARK = '__dialog'

/** Сколько модалок открыто на этой записи истории: 0 — запись самой страницы. */
function dialogDepth(state: unknown): number {
  if (!state || typeof state !== 'object')
    return 0
  return Number((state as Record<string, unknown>)[DIALOG_MARK]) || 0
}

function setupWebBack() {
  const dialog = useDialogStore()
  /** Модалки закрыл сам «назад» — их записи истории уже сняты. */
  let closingFromHistory = false
  let destroys = dialog.destroyCount

  watch(() => dialog.dialogs.length, (count, previous = 0) => {
    if (count > previous) {
      // Копия состояния роутера: для него это та же страница, позиция в истории не сбивается
      for (let depth = previous + 1; depth <= count; depth++)
        history.pushState({ ...history.state, [DIALOG_MARK]: depth }, '')
      return
    }
    if (closingFromHistory) {
      closingFromHistory = false
      return
    }
    // Модалки сбросили разом (выход из аккаунта) — рядом идёт переход, историю не трогаем:
    // оставшиеся записи пропустит следующий «назад»
    if (dialog.destroyCount !== destroys) {
      destroys = dialog.destroyCount
      return
    }
    // Закрыли крестиком или тапом по фону — снимаем записи этих модалок, чтобы «назад» работал как обычно.
    // Если со страницы уже ушли, верхняя запись не наша — её не трогаем
    if (count < previous && dialogDepth(history.state) === previous)
      history.go(count - previous)
  })

  window.addEventListener('popstate', (event) => {
    const depth = dialogDepth(event.state)
    const open = dialog.dialogs.length
    if (open > depth) {
      closingFromHistory = true
      for (let i = depth; i < open; i++)
        dialog.close()
      return
    }
    // Записи остались от модалок, закрытых без нас, — пропускаем их до самой страницы
    if (open === 0 && depth > 0)
      history.go(-depth)
  })
}
