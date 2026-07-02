import { FileOpener } from '@capacitor-community/file-opener'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { useNotificationStore } from '@/shared/stores/notification'

const CURRENT_VERSION = '1.0.0'
const GITHUB_REPO = 'RealTimeMap/RealTimeMap-frontend'

export async function initUpdateChecker() {
  const notify = useNotificationStore()

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
    if (!response.ok)
      return

    const latestRelease = await response.json()
    const latestVersion = latestRelease.tag_name.replace('v', '')

    if (latestVersion === CURRENT_VERSION)
      return

    const apkAsset = latestRelease.assets.find((asset: any) => asset.name.endsWith('.apk'))
    if (!apkAsset)
      return

    notify.add({
      title: `Доступно обновление v${latestVersion}`,
      description: latestRelease.body || 'Установите новую версию приложения для стабильной работы.',
      type: 'info',
      icon: 'solar:download-square-bold',
      action: {
        text: 'Обновить',
        callback: () => {
          downloadAndInstall(apkAsset.browser_download_url)
        },
      },
    })
  }
  catch (error) {
    console.error('Ошибка автоматической проверки обновлений:', error)
  }
}

async function downloadAndInstall(url: string) {
  const notify = useNotificationStore()

  try {
    notify.add({
      title: 'Загрузка...',
      description: 'Новая версия скачивается в фоновом режиме.',
      type: 'default',
    })

    const downloadResult = await Filesystem.downloadFile({
      url,
      path: 'update.apk',
      directory: Directory.Cache,
      webFetchExtra: {
        mode: 'no-cors',
      },
    })

    if (!downloadResult || !downloadResult.path) {
      throw new Error('Путь к файлу не найден')
    }

    await FileOpener.open({
      filePath: downloadResult.path,
      contentType: 'application/vnd.android.package-archive',
    })
  }
  catch (error: any) {
    notify.add({
      title: 'Ошибка установки',
      description: 'Не удалось скачать или запустить установку APK.',
      type: 'error',
    })
    console.error('Ошибка при обновлении приложения:', error?.message || error)
  }
}
