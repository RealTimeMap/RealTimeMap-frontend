import type { StatsHeatmap, StatsMonthy, StatsSummary } from './index.type'

interface Endpoints {
  summary: StatsSummary
  monthly: StatsMonthy[]
  heatmap: StatsHeatmap
  // categories: StatsCategories
}

export const statisticsApi = {
  fetchStats<K extends keyof Endpoints>(
    id: number,
    type: K,
    ...args: K extends 'heatmap' ? [params: { start: string, end?: string }] : [params?: never]
  ) {
    return apiService.get<Endpoints[K]>(`/profile/${id}/statistics/${type}`, {
      params: args[0],
    })
  },
}
