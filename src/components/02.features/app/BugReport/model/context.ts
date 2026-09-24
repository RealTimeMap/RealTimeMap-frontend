import type { BugApp, BugDevice } from '@/components/00.shared/services/bug/index.type'
import { getBugLogs } from '@/components/00.shared/lib/bugLogger'
import { detectOs, detectPlatform } from '@/components/00.shared/lib/platform'

declare const __APP_VERSION__: string

interface BatteryManager { level: number }
type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryManager> }

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
