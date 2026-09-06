import type { AchiveUserPayload, AchiveUserResponse, AllAchievementsPayload, CatalogAchievement, NearestAchievementsResponse } from './index.type'

export const achievementApi = {
  /**
   * Получить каталог всех достижений системы (корневые + вложенный next).
   */
  getAllAchievements: (payload: AllAchievementsPayload = {}) =>
    apiService.get<CatalogAchievement[]>(`/achievement/all`, {
      params: {
        page: payload.page,
        pageSize: payload.pageSize,
      },
    }),

  /**
   * Получить одно достижение по ID (голый объект с reward и next)
   */
  getAchievementById: (id: number) =>
    apiService.get<CatalogAchievement>(`/achievement/${id}`),

  /**
   * Получить все разблокированные достижения пользователя
   */
  getAchiveUser: (payload: AchiveUserPayload) =>
    apiService.get<AchiveUserResponse>(`/achievement/user/${payload.id}`, {
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
    apiService.get<NearestAchievementsResponse>(`/achievement/user/${userId}/nearest/`),
}
