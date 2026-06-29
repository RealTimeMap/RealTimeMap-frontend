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
}

export interface NearestAchievementItem {
  achievement: Achievement
  current: number
  threshold: number
  progress: number
}

export interface AchiveUserResponse {
  items: UserAchievementItem[]
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
