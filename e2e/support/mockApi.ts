import type { BrowserContext, Route } from '@playwright/test'
import { API_BASE, API_ORIGIN, IMAGE_ORIGIN } from './env'

export const ME = {
  userId: 42,
  username: 'Tester',
  tag: 'tester',
  avatar: `${IMAGE_ORIGIN}/avatar.png`,
  settings: { showInSearch: true },
  gamification: {
    currentLevel: 7,
    currentLevelName: 'Исследователь',
    currentXp: 340,
    progressPercent: 68,
    xpForNextLevel: 500,
    nextLevel: { level: 8, levelName: 'Следопыт' },
  },
}

function achievement(id: number) {
  return {
    id,
    code: `a${id}`,
    title: `Достижение ${id}`,
    desc: 'Описание',
    triggerEventType: 'mark_created',
    threshold: 10,
    icon: 'app:pin',
  }
}

function mark(id: number) {
  return {
    id,
    markName: `Метка ${id}`,
    geom: { type: 'Point', coordinates: [37.6 + id / 100, 55.75] },
    photos: [],
  }
}

function page<T>(items: T[], total = items.length) {
  return {
    items,
    page: 1,
    pageSize: items.length || 1,
    totalPages: 1,
    total,
    hasNext: false,
  }
}

const emptySection = { upserted: [], removed: [], cursor: 1, hasMore: false }

type Handler = (url: URL) => unknown

/** Ответы по умолчанию; путь — без префикса API_BASE. Первое совпадение выигрывает. */
const DEFAULT_HANDLERS: Array<[RegExp, Handler]> = [
  [/^\/profile\/me$/, () => ME],
  [/^\/profile\/settings$/, () => ({ showInSearch: true, privateProfile: false })],
  [/^\/profile\/\d+\/statistics\/summary$/, () => ({ markCount: 12, friendsCount: '3', subscribersCount: '15', subscriptionsCount: '8' })],
  [/^\/profile\/(\d+)$/, url => ({ ...ME, userId: Number(url.pathname.split('/').pop()), username: 'Other', tag: 'other' })],
  [/^\/achievement\/user\/\d+\/nearest\/?$/, () => ({ items: [1, 2, 3, 4].map(id => ({ achievement: achievement(id), current: 4, threshold: 10, progress: 40 })) })],
  [/^\/achievement\/all$/, () => Array.from({ length: 20 }, (_, i) => achievement(i + 1))],
  [/^\/achievement\/user\/\d+$/, () => page([], 9)],
  [/^\/subscriptions\/status\/\d+$/, () => ({ subscribed: false })],
  [/^\/subscriptions/, () => page([], 8)],
  [/^\/marks\/\d+\/list$/, () => page([1, 2, 3, 4].map(mark), 12)],
  [/^\/chats\/?$/, () => []],
  [/^\/personal\/sync$/, () => ({ sections: { personalMarks: emptySection, groups: emptySection }, cursor: 1, hasMore: false, updateTo: 1 })],
  [/^\/group\/list$/, () => page([])],
]

export class MockApi {
  private overrides: Array<[RegExp, Handler]> = []
  private down = false
  readonly requests: string[] = []

  /** Подменить ответ для пути (без префикса API). Действует до конца теста. */
  respond(path: RegExp, body: unknown | Handler) {
    this.overrides.unshift([path, typeof body === 'function' ? body as Handler : () => body])
  }

  /** Сервер недоступен: запросы обрываются без ответа, как при потере сети. */
  setServerDown(down: boolean) {
    this.down = down
  }

  async install(context: BrowserContext) {
    await context.route(`${API_ORIGIN}/**`, route => this.handle(route))
    await context.routeWebSocket(new RegExp(API_ORIGIN.replace(/\./g, '\\.')), ws => ws.close())
  }

  private async handle(route: Route) {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const path = url.pathname.replace(new URL(API_BASE).pathname, '')
    this.requests.push(`${method} ${path}`)

    if (this.down)
      return route.abort('internetdisconnected')

    const headers = { 'access-control-allow-origin': '*' }
    if (method === 'OPTIONS')
      return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    if (method !== 'GET')
      return route.fulfill({ json: {}, headers })

    const handler = [...this.overrides, ...DEFAULT_HANDLERS].find(([re]) => re.test(path))?.[1]
    return route.fulfill({ json: handler ? handler(url) : [], headers })
  }
}
