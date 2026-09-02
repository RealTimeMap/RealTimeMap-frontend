import type { BugApp, BugDevice } from '@/components/00.shared/services/bug/index.type'
import { Capacitor } from '@capacitor/core'
import { getBugLogs } from '@/components/00.shared/lib/bugLogger'

declare const __APP_VERSION__: string

interface BatteryManager { level: number }
type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryManager> }

function detectOs(): string {
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

function detectPlatform(): string {
  const map: Record<string, string> = { web: 'Web', ios: 'iOS', android: 'Android' }
  const p = Capacitor.getPlatform()
  return map[p] ?? p
}

async function detectBattery(): Promise<number> {
  const nav = navigator as NavigatorWithBattery
  try {
    if (typeof nav.getBattery === 'function') {
      const battery = await nav.getBattery()
      return Math.round(battery.level * 100)
    }
  }
  catch { }
  return 100
}

export async function collectBugContext(): Promise<{ device: BugDevice, app: BugApp }> {
  const device: BugDevice = {
    os: detectOs(),
    platform: detectPlatform(),
    resolution: `${window.screen.width}x${window.screen.height}`,
    battery: await detectBattery(),
  }

  const app: BugApp = {
    build: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
    logs: getBugLogs(),
  }

  return { device, app }
}
