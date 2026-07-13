import type { Map } from 'maplibre-gl'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { toPng } from 'html-to-image'
import { defineStore } from 'pinia'

interface ShareData {
  id: number
  title: string
  description: string
  url: string
  date: string
  markImg: string
  likes: number
  coordinates: [number, number]
}

export const useShareStore = defineStore('share', () => {
  const mapInstance = shallowRef<Map | null>(null)
  const isGenerating = ref(false)
  const shareData = ref<ShareData | null>(null)
  const mapScreenshot = ref<string>('')
  const rendererRef = ref<HTMLElement | null>(null)

  const registerMap = (map: Map) => {
    mapInstance.value = map
  }

  const shareMark = async (data: ShareData) => {
    if (!mapInstance.value)
      return
    isGenerating.value = true

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
        return

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
        }
        catch (fsError) {
          console.error('[Native Share Error]', fsError)
        }
      }
      else {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], `mark-${data.id}.png`, { type: 'image/png' })

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: data.title,
            text: data.description,
            url: data.url,
            files: [file],
          })
        }
        else {
          const link = document.createElement('a')
          link.download = `mark-${data.id}.png`
          link.href = dataUrl
          link.click()
        }
      }
    }
    catch (e) {
      console.error(e)
      mapInstance.value.jumpTo({ center: originalCenter, zoom: originalZoom })
    }
    finally {
      isGenerating.value = false
      setTimeout(() => {
        shareData.value = null
        mapScreenshot.value = ''
      }, 1000)
    }
  }

  return {
    registerMap,
    shareMark,
    shareData,
    mapScreenshot,
    rendererRef,
    isGenerating,
  }
})
