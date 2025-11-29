export interface User {
  id: number
  email: string
  is_active?: boolean
  is_superuser?: boolean
  is_verified?: boolean
  phone?: string
  username: string
  avatar?: string
  subscription?: UserSubscription
  ban?: UserBan
  gamefication?: UserGemefication
}

interface UserSubscription {
  payment_provider_id?: string
  starts_at: Date
  ends_at: Date
}

interface UserBan {
  id: number
  user_id: number
  moderator_id: number
  reason: 'abuse' | 'spam' | 'other'
}

interface UserGemefication {
  /**
   * текущий уровень пользователя
   */
  current_level: number
  /**
   * текущий опыт
   */
  current_exp: number
  /**
   * Следующий уровень (вычисляется бэком)
   */
  next_level?: {
    /**
     * Числовое значение следующего уровня
     */
    level: number
    /**
     * Требуемое кол-во опыта для перехода на данный уровень
     */
    required_exp: number
  }
  /**
   * Значение опыта которое необходимо для перехода на новый уровень
   */
  exp_for_level_up: number
}

export type UserIncludeType = 'ban' | 'gamefication' | 'subscription'

export interface GetProfileParams {
  include?: UserIncludeType[]
}
