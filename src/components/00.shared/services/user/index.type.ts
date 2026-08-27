export interface User {
  userId: number
  username: string
  avatar?: string
  tag: string
  settings: {
    showInSearc: boolean
  }
  // subscription?: UserSubscription
  // ban?: UserBan
  gamification?: UserGemefication
}

interface _UserSubscription {
  payment_provider_id?: string
  starts_at: Date
  ends_at: Date
}

interface _UserBan {
  id: number
  user_id: number
  moderator_id: number
  reason: 'abuse' | 'spam' | 'other'
}

export interface UserGemefication {
  /**
   * текущий уровень пользователя
   */
  currentLevel: number
  /**
   * Текущее название уровня
   */
  currentLevelName: string
  /**
   * текущий опыт
   */
  currentXp: number
  /**
   * Прогресс уровня
   */
  progressPercent: number
  /**
   * Значение опыта которое необходимо для перехода на новый уровень
   */
  xpForNextLevel: number

  nextLevel: {
    level: number
    levelName: string
  }
}

export type UserIncludeType = 'ban' | 'gamefication' | 'subscription'

export interface GetProfileParams {
  include?: UserIncludeType[]
}

export interface UpdateProfilePayload {
  username?: string
  tag?: string
  avatar?: File
}
