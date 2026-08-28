import { registerPlugin } from '@capacitor/core'

export interface LiveCapsulePlugin {
  showStatus: (
    options: {
      text: string
      shortText?: string
      progress?: number
    },
  ) => Promise<void>
  hideStatus: () => Promise<void>
}

export const LiveCapsule = registerPlugin<LiveCapsulePlugin>('LiveCapsule')
