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

export interface MapMark {
  id: number
  markName: string
  geom: { type: 'Point', coordinates: [number, number] }
  photos: string[]
}

export function markFull(mark: MapMark) {
  const now = Date.now()
  return {
    ...mark,
    additionalInfo: 'Описание метки',
    category: { id: 1, categoryName: 'Событие', color: '#7c3aed', icon: 'app:pin' },
    owner: { id: 7, username: 'Other', avatar: '', tag: 'other' },
    date: {
      startAt: new Date(now - 3600_000).toISOString(),
      endAt: new Date(now + 5 * 3600_000).toISOString(),
      progressPercent: 20,
      daysPassed: 0,
      daysLeft: 0,
    },
    meta: { status: 'active', markType: 'user' },
    like: { count: 3, isLiked: false, canLike: true },
    share: { count: 1 },
  }
}

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
  [/^\/\d+\/comments\/?$/, () => ({ items: [], hasMore: false })],
  [/accrual\/\d+\/stat$/, () => ({ likes: '3', shares: '1', isLiked: false, canLike: true })],
  [/^\/chats\/?$/, () => []],
  [/^\/personal\/sync$/, () => ({ sections: { personalMarks: emptySection, groups: emptySection }, cursor: 1, hasMore: false, updateTo: 1 })],
  [/^\/group\/list$/, () => page([])],
]

export class MockApi {
  private overrides: Array<[RegExp, Handler]> = []
  /** Метки, которые socket.io-сервер `/marks` отдаёт на запрос карты. */
  mapMarks: MapMark[] = []
  private marksSocket: { send: (message: string) => void } | null = null

  /** Сервер сообщает о новой метке, как событие marksCreated в реальном времени. */
  pushCreatedMark(mark: MapMark) {
    this.mapMarks.push(mark)
    this.marksSocket?.send(`42/marks,${JSON.stringify(['marksCreated', mark])}`)
  }

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
    // Сокеты ходят по wss://, поэтому сопоставляем по хосту, без протокола
    const origin = new URL(API_ORIGIN).host.replace(/\./g, '\\.')
    await context.routeWebSocket(new RegExp(origin), ws => ws.close())
    // Регистрация позже — приоритет выше: мини-сервер socket.io для меток на карте
    await context.routeWebSocket(new RegExp(`${origin}/marks/socket\\.io`), (ws) => {
      this.marksSocket = ws
      // engine.io: пакет открытия «0» + параметры соединения
      ws.send(`0${JSON.stringify({ sid: 'e2e', upgrades: [], pingInterval: 600000, pingTimeout: 600000, maxPayload: 1e6 })}`)
      ws.onMessage((message) => {
        const text = String(message)
        if (text.startsWith('40/marks'))
          ws.send('40/marks,{"sid":"e2e-marks"}')
        // Запрос меток с ack: 42/marks,<id>["message",{...}] → 43/marks,<id>[{marks}]
        const request = text.match(/^42\/marks,(\d+)\["message"/)
        if (request)
          ws.send(`43/marks,${request[1]}${JSON.stringify([{ marks: this.mapMarks }])}`)
      })
    })
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

    const full = path.match(/^\/marks\/(\d+)$/)
    if (full) {
      const found = this.mapMarks.find(m => m.id === Number(full[1]))
      if (found)
        return route.fulfill({ json: markFull(found), headers })
    }

    const handler = [...this.overrides, ...DEFAULT_HANDLERS].find(([re]) => re.test(path))?.[1]
    return route.fulfill({ json: handler ? handler(url) : [], headers })
  }
}
