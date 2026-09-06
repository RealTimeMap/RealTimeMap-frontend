import { FileOpener } from '@capacitor-community/file-opener'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { compareVersions } from 'compare-versions'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { summarizeRelease } from './summarizeRelease'

declare const __APP_VERSION__: string
const GITHUB_REPO = 'RealTimeMap/RealTimeMap-frontend'
const API_GITHUB_RELEASES_LATEST = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases/latest`

interface UpdateAction {
  text: string
  callback: () => void
}

function resolveUpdateAction(latestRelease: any): UpdateAction | null {
  switch (Capacitor.getPlatform()) {
    case 'android': {
      const apkAsset = latestRelease.assets?.find(
        (asset: any) => asset.name.endsWith('.apk'),
      )
      if (!apkAsset)
        return null

      return {
        text: 'Обновить',
        callback: () => downloadAndInstall(apkAsset.browser_download_url),
      }
    }

    case 'ios':
      return {
        text: 'Открыть',
        callback: () => window.open(latestRelease.html_url, '_blank'),
      }

    default:
      return null
  }
}

export async function initUpdateChecker() {
  if (!Capacitor.isNativePlatform())
    return

  const notify = useNotificationStore()

  try {
    const response = await fetch(API_GITHUB_RELEASES_LATEST)
    if (!response.ok)
      return

    const latestRelease = await response.json()
    const latestVersion = latestRelease.tag_name.replace(/[^\d.]/g, '')

    if (compareVersions(latestVersion, __APP_VERSION__) <= 0)
      return

    const action = resolveUpdateAction(latestRelease)
    if (!action)
      return

    notify.add({
      title: `Доступно обновление v${latestVersion}`,
      description: summarizeRelease(latestRelease.body),
      type: 'default',
      icon: 'solar:download-square-bold',
      duration: 0,
      action,
    })
  }
  catch (error) {
    console.error('Ошибка автоматической проверки обновлений:', error)
  }
}

export async function checkForUpdates() {
  const notify = useNotificationStore()

  try {
    const response = await fetch(API_GITHUB_RELEASES_LATEST)
    if (!response.ok) {
      notify.add({ title: 'Не удалось проверить обновления', type: 'error' })
      return
    }

    const latestRelease = await response.json()
    const latestVersion = latestRelease.tag_name.replace(/[^\d.]/g, '')

    if (compareVersions(latestVersion, __APP_VERSION__) <= 0) {
      notify.add({
        title: 'У вас последняя версия',
        description: `v${__APP_VERSION__}`,
        type: 'success',
      })
      return
    }

    const action = resolveUpdateAction(latestRelease) ?? {
      text: 'Открыть',
      callback: () => window.open(latestRelease.html_url, '_blank'),
    }

    notify.add({
      title: `Доступно обновление v${latestVersion}`,
      description: summarizeRelease(latestRelease.body),
      type: 'default',
      icon: 'solar:download-square-bold',
      duration: 0,
      action,
    })
  }
  catch (error) {
    console.error('Ошибка проверки обновлений:', error)
    notify.add({ title: 'Не удалось проверить обновления', type: 'error' })
  }
}

export async function downloadAndroidApp() {
  try {
    const response = await fetch(API_GITHUB_RELEASES_LATEST)
    if (!response.ok) {
      window.open(GITHUB_RELEASES_PAGE, '_blank')
      return
    }
    const latestRelease = await response.json()
    const apkAsset = latestRelease.assets?.find(
      (asset: any) => asset.name.endsWith('.apk'),
    )
    window.open(apkAsset?.browser_download_url ?? GITHUB_RELEASES_PAGE, '_blank')
  }
  catch (error) {
    console.error('Не удалось получить ссылку на APK:', error)
    window.open(GITHUB_RELEASES_PAGE, '_blank')
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
