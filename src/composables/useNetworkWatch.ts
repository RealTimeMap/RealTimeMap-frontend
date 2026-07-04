import { Network } from '@capacitor/network'
import { useNotificationStore } from '@/shared/stores/notification'

export function useNetworkWatch() {
  const notify = useNotificationStore()

  const initNetworkListener = async () => {
    const status = await Network.getStatus()

    if (!status.connected) {
      triggerOfflineAlert()
    }

    await Network.addListener('networkStatusChange', (status) => {
      if (!status.connected) {
        triggerOfflineAlert()
      }
      else {
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
      description: 'Интернет пропал. Карта переведена в автономный режим.',
      type: 'warning',
    })
  }

  return { initNetworkListener }
}
