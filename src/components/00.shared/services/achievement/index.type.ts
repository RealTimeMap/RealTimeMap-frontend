export interface AchievementReward {
  id: number
  code: string
  amount: number
}

export interface AchievementBase {
  id: number
  code: string
  title: string
  desc: string
  triggerEventType: string
  threshold: number
  icon: string
}

export interface Achievement extends AchievementBase {
  reward?: AchievementReward
  next?: AchievementBase
}

export interface UserAchievementItem {
  achievement: Achievement
  unlockedAt: string
  current?: number
  progress?: number
}

export interface NearestAchievementItem {
  achievement: Achievement
  current: number
  threshold: number
  progress: number
}

export interface AchiveUserResponse {
  items: UserAchievementItem[]
  page: number
  pageSize: number
  totalPages: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

export interface NearestAchievementsResponse {
  items: NearestAchievementItem[]
}

export interface AchiveUserPayload {
  id: number
  page?: number
  limit?: number
  pageSize?: number
}
