export interface User {
  userId: number
  username: string
  avatar?: string
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

interface UserGemefication {
  /**
   * текущий уровень пользователя
   */
  currentLevel: number
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
}

export type UserIncludeType = 'ban' | 'gamefication' | 'subscription'

export interface GetProfileParams {
  include?: UserIncludeType[]
}
