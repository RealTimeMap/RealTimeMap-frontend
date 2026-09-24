import { Preferences } from '@capacitor/preferences'

const STORAGE_KEY = 'rtm_welcome_seen'

// Флаг меняется один раз, а читается роутером перед каждой навигацией
let seenCache: boolean | null = null

export async function hasSeenOnboarding(): Promise<boolean> {
  if (seenCache !== null)
    return seenCache
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    seenCache = value === 'true'
    return seenCache
  }
  catch (e) {
    console.error('[Onboarding Check Error]', e)
    return false
  }
}

export async function markOnboardingSeen(): Promise<void> {
  await Preferences.set({ key: STORAGE_KEY, value: 'true' })
  seenCache = true
}
