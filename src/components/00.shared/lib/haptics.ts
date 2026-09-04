import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { getCookie } from '@/components/00.shared/lib/cookie'

const HAPTICS_COOKIE_NAME = 'haptics_enabled'

function isEnabled(): boolean {
  return getCookie(HAPTICS_COOKIE_NAME) !== 'false'
}

const isAndroid = Capacitor.getPlatform() === 'android'

export async function hapticLight() {
  if (!isEnabled())
    return
  try {
    if (isAndroid)
      await Haptics.vibrate({ duration: 20 })
    else
      await Haptics.impact({ style: ImpactStyle.Light })
  }
  catch { }
}

export async function hapticMedium() {
  if (!isEnabled())
    return
  try {
    if (isAndroid)
      await Haptics.vibrate({ duration: 40 })
    else
      await Haptics.impact({ style: ImpactStyle.Medium })
  }
  catch { }
}

export async function hapticSuccess() {
  if (!isEnabled())
    return
  try {
    if (isAndroid)
      await Haptics.vibrate({ duration: 60 })
    else
      await Haptics.notification({ type: NotificationType.Success })
  }
  catch { }
}
