export type BugTag = 'feature' | 'ui' | 'logic'

export interface BugDevice {
  os: string
  platform: string
  resolution: string
  battery: number
}

export interface BugApp {
  build: string
  logs: string[]
}

export interface BugCreatePayload {
  title: string
  desc: string
  tag: BugTag
  device: BugDevice
  app: BugApp
}
