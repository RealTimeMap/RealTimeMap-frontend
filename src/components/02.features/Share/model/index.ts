import type { Map } from 'maplibre-gl'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { toPng } from 'html-to-image'
import { defineStore } from 'pinia'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

interface ShareData {
  id: number
  title: string
  description: string
  url: string
  date: string
  markImg: string
  likes: string | number
  coordinates: [number, number]
}

export const useShareStore = defineStore('share', () => {
  const notify = useNotificationStore()
  const mapInstance = shallowRef<Map | null>(null)
  const isGenerating = ref(false)
  const shareData = ref<ShareData | null>(null)
  const mapScreenshot = ref<string>('')
  const rendererRef = ref<HTMLElement | null>(null)

  const registerMap = (map: Map) => {
    mapInstance.value = map
  }

  const shareMark = async (data: ShareData): Promise<boolean> => {
    if (!mapInstance.value)
      return false
    isGenerating.value = true
    let didShare = false

    const originalCenter = mapInstance.value.getCenter()
    const originalZoom = mapInstance.value.getZoom()

    try {
      mapInstance.value.jumpTo({
        center: data.coordinates,
        zoom: 16,
      })

      await new Promise((resolve) => {
        mapInstance.value!.once('idle', resolve)
        setTimeout(resolve, 1000)
      })

      const canvas = mapInstance.value.getCanvas()
      mapScreenshot.value = canvas.toDataURL('image/png')
      shareData.value = data

      await nextTick()
      await new Promise(r => setTimeout(r, 400))

      if (!rendererRef.value)
        return false

      const dataUrl = await toPng(rendererRef.value, { cacheBust: true, pixelRatio: 2 })
      mapInstance.value.jumpTo({ center: originalCenter, zoom: originalZoom })

      if (Capacitor.isNativePlatform()) {
        try {
          const fileName = `share-mark-${data.id}.png`
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: dataUrl,
            directory: Directory.Cache,
          })

          await Share.share({
            title: data.title,
            text: data.description,
            url: savedFile.uri,
            dialogTitle: 'Поделиться меткой',
          })
          didShare = true
        }
        catch (fsError) {
          console.error('[Native Share Error]', fsError)
        }
      }
      else {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], `mark-${data.id}.png`, { type: 'image/png' })

        const canWebShare
          = typeof navigator.share === 'function'
            && typeof navigator.canShare === 'function'
            && navigator.canShare({ files: [file] })

        if (canWebShare) {
          try {
            const shareText = [data.description, data.url].filter(Boolean).join('\n\n')
            await navigator.share({
              title: data.title,
              text: shareText,
              files: [file],
            })
            didShare = true
          }
          catch (shareError) {
            if ((shareError as Error).name !== 'AbortError')
              throw shareError
          }
        }
        else {
          const link = document.createElement('a')
          link.download = `mark-${data.id}.png`
          link.href = dataUrl
          link.click()

          try {
            await navigator.clipboard?.writeText(data.url)
            notify.add({ title: 'Изображение скачано, ссылка скопирована', type: 'success' })
          }
          catch {
            notify.add({ title: 'Изображение метки скачано', type: 'success' })
          }
          didShare = true
        }
      }
    }
    catch (e) {
      console.error(e)
      notify.add({ title: 'Не удалось поделиться меткой', type: 'error' })
      mapInstance.value.jumpTo({ center: originalCenter, zoom: originalZoom })
    }
    finally {
      isGenerating.value = false
      setTimeout(() => {
        shareData.value = null
        mapScreenshot.value = ''
      }, 1000)
    }

    return didShare
  }

  return {
    registerMap,
    mapInstance,
    shareMark,
    shareData,
    mapScreenshot,
    rendererRef,
    isGenerating,
  }
})
