import { Network } from '@capacitor/network'
import { useNotificationStore } from '@/shared/stores/notification'

export function useNetworkWatch() {
  const notify = useNotificationStore()
  let lastConnectionType = 'unknown'

  const initNetworkListener = async () => {
    const status = await Network.getStatus()
    lastConnectionType = status.connectionType

    if (status.connectionType === 'none' || status.connectionType === 'unknown') {
      triggerOfflineAlert()
    }

    await Network.addListener('networkStatusChange', (status) => {
      if (status.connectionType === lastConnectionType)
        return

      const prevType = lastConnectionType
      lastConnectionType = status.connectionType

      if (status.connectionType === 'none' || status.connectionType === 'unknown') {
        triggerOfflineAlert()
      }
      else if (
        (prevType === 'none' || prevType === 'unknown')
        && (
          status.connectionType === 'wifi'
          || status.connectionType === 'cellular')
      ) {
        notify.add({
          title: 'Сеть восстановлена',
          description: 'Приложение снова подключено к серверу реального времени.',
          type: 'success',
        })
      }
    })
  }

  function triggerOfflineAlert() {
    notify.add({
      title: 'Проблемы со связью',
      description: `
        Интернет пропал или тип сети не поддерживается.
        Карта переведена в автономный режим.
      `,
      type: 'warning',
    })
  }

  return { initNetworkListener }
}
