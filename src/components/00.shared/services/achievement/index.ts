import type { AchiveUserPayload, AchiveUserResponse, NearestAchievementsResponse } from './index.type'

export const achievementApi = {
  /**
   * Получить все разблокированные достижения пользователя
   */
  getAchiveUser: (payload: AchiveUserPayload) =>
    apiService.get<AchiveUserResponse>(`/achievement/${payload.id}`, {
      params: {
        page: payload.page,
        limit: payload.limit,
        pageSize: payload.pageSize,
      },
    }),

  /**
   * Получить ближайшие к выполнению достижения
   */
  getNearestAchievements: (userId: number) =>
    apiService.get<NearestAchievementsResponse>(`/achievement/${userId}/nearest`),
}
