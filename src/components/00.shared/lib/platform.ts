import { Capacitor } from '@capacitor/core'

export function detectOs(): string {
  const ua = navigator.userAgent
  if (/windows nt/i.test(ua))
    return 'Windows'
  if (/android/i.test(ua))
    return `Android${/android[ /]([\d.]+)/i.exec(ua)?.[1] ? ` ${/android[ /]([\d.]+)/i.exec(ua)![1]}` : ''}`
  if (/iphone|ipad|ipod/i.test(ua))
    return 'iOS'
  if (/mac os x/i.test(ua))
    return 'macOS'
  if (/linux/i.test(ua))
    return 'Linux'
  return 'Unknown'
}

export function detectPlatform(): string {
  const map: Record<string, string> = { web: 'Web', ios: 'iOS', android: 'Android' }
  const p = Capacitor.getPlatform()
  return map[p] ?? p
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android' || /android/i.test(navigator.userAgent)
}
