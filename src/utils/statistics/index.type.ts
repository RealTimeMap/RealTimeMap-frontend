export interface StatsSummary {
  /* Общее количество созданных меток */
  markCount: number
  /* Общее количество друзей */
  friendsCount: number
  /* Общее количество подписчиков */
  subscribersCount: number
}

export interface StatsMonthy {
  /* Полное название месяца (например, 'January') */
  month: string
  /* Короткое название месяца (первые 3 символа, например, 'Jan') */
  shortMonth: string
  /* Количество меток, созданных пользователем в этом месяце */
  count: number
}

interface StatsHeatmapItem {
  /* Дата дня (ISO 8601) */
  day: string
  /* Количество меток, созданных в этот день */
  count: number
}

interface StatsHeatmapRange {
  /* Начало периода (ISO 8601) */
  start: string
  /* Конец периода (ISO 8601) */
  end: string
}

export interface StatsHeatmap {
  items: StatsHeatmapItem[]
  range: StatsHeatmapRange
}
