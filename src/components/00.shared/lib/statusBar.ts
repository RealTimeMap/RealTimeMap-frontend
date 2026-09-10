import type { ThemeBase } from './theme'
import { Capacitor } from '@capacitor/core'

export function syncStatusBar(base: ThemeBase, backgroundColor?: string): void {
  if (!Capacitor.isNativePlatform())
    return

  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: base === 'light' ? Style.Light : Style.Dark }).catch(() => {})

    if (Capacitor.getPlatform() === 'android') {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})

      if (backgroundColor)
        StatusBar.setBackgroundColor({ color: backgroundColor }).catch(() => {})
    }
  }).catch(() => {})
}
