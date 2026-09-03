import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { getCookie } from '@/components/00.shared/lib/cookie'

const HAPTICS_COOKIE_NAME = 'haptics_enabled'

function isEnabled(): boolean {
  return getCookie(HAPTICS_COOKIE_NAME) !== 'false'
}

export async function hapticLight() {
  if (!isEnabled())
    return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  }
  catch { }
}

export async function hapticMedium() {
  if (!isEnabled())
    return
  try {
    await Haptics.impact({ style: ImpactStyle.Medium })
  }
  catch { }
}

export async function hapticSuccess() {
  if (!isEnabled())
    return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  }
  catch { }
}
