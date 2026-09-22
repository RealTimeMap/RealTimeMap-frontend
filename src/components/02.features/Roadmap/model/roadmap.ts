export type RoadmapStatus = 'done' | 'active' | 'planned'

export interface RoadmapItem {
  id: string
  title: string
  desc: string
  icon: string
  color: string
  status: RoadmapStatus
}

export const ROADMAP: RoadmapItem[] = [
  {
    id: 'filters',
    title: 'Более широкие фильтры меток',
    desc: 'Гибкий отбор по категориям, времени и радиусу',
    icon: 'app:layers-loop',
    color: '#2f8bff',
    status: 'active',
  },
  {
    id: 'performance',
    title: 'Более быстрая работа приложения',
    desc: 'Оптимизация рендера карты и синхронизации данных',
    icon: 'app:gauge',
    color: '#14b8a6',
    status: 'active',
  },
  {
    id: 'family',
    title: 'Семейный функционал',
    desc: 'Общий доступ к выбранным записям для близких — семья RTM',
    icon: 'app:people-loop',
    color: '#ec4899',
    status: 'planned',
  },
  {
    id: 'moderation',
    title: 'Более глубокая модерация',
    desc: 'Расширенные инструменты жалоб и проверки контента',
    icon: 'app:flag',
    color: '#f43f5e',
    status: 'planned',
  },
  {
    id: 'events',
    title: 'Интерактивные мероприятия',
    desc: 'Системные события и активности прямо на вашей карте',
    icon: 'app:calendar',
    color: '#8b5cf6',
    status: 'planned',
  },
  {
    id: 'achievements',
    title: 'Больше достижений',
    desc: 'Новый набор наград и бейджей для профиля',
    icon: 'app:trophy-loop',
    color: '#f59e0b',
    status: 'planned',
  },
  {
    id: 'landmarks',
    title: 'Достопримечательности',
    desc: 'Интересные места и точки притяжения на карте',
    icon: 'app:city',
    color: '#22c55e',
    status: 'planned',
  },
  {
    id: 'subscriptions',
    title: 'Подписки',
    desc: 'Кастомизация метки и профиля, больше дневных лимитов, уникальный бейдж и слоты в семье RTM',
    icon: 'app:crown-loop',
    color: '#eab308',
    status: 'planned',
  },
]

export const STATUS_LABEL: Record<RoadmapStatus, string> = {
  done: 'Готово',
  active: 'В работе',
  planned: 'В планах',
}

const STATUS_WEIGHT: Record<RoadmapStatus, number> = {
  done: 1,
  active: 0.5,
  planned: 0,
}

export function roadmapProgress(items: RoadmapItem[] = ROADMAP): number {
  if (!items.length)
    return 0

  const sum = items.reduce((acc, item) => acc + STATUS_WEIGHT[item.status], 0)
  return Math.round((sum / items.length) * 100)
}

export function roadmapCounts(items: RoadmapItem[] = ROADMAP): Record<RoadmapStatus, number> {
  return items.reduce(
    (acc, item) => {
      acc[item.status] += 1
      return acc
    },
    { done: 0, active: 0, planned: 0 } as Record<RoadmapStatus, number>,
  )
}
