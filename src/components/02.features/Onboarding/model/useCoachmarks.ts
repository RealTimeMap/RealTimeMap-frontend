import { Preferences } from '@capacitor/preferences'

export function useCoachmarks() {
  async function shouldShow(id: string): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: `coach_${id}` })
      return value !== 'true'
    }
    catch (e) {
      console.error('[Coachmark Check Error]', e)
      return false
    }
  }

  async function markSeen(id: string): Promise<void> {
    try {
      await Preferences.set({ key: `coach_${id}`, value: 'true' })
    }
    catch (e) {
      console.error('[Coachmark Save Error]', e)
    }
  }

  return {
    shouldShow,
    markSeen,
  }
}
