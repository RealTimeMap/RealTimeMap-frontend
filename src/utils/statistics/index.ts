import type { StatsHeatmap, StatsMonthy, StatsSummary } from './index.type'
import { getCookie } from '@/shared/lib/cookie'

const getHeaders = () => ({ Authorization: `Bearer ${getCookie('token')}` })

interface Endpoints {
  summary: StatsSummary
  monthy: StatsMonthy[]
  heatmap: StatsHeatmap
}

export const statisticsApi = {
  fetchStats<K extends keyof Endpoints>(
    id: number,
    type: K,
    ...args: K extends 'heatmap' ? [params: { start: string, end?: string }] : [params?: never]
  ) {
    return apiService.get<Endpoints[K]>(`/profile/${id}/statistics/${type}`, {
      headers: getHeaders(),
      params: args[0],
    })
  },
}
