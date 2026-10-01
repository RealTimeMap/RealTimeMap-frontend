import type { RouteLocationNormalized } from 'vue-router'

export type PageTransitionName = 'slide-left' | 'slide-right' | 'fade' | 'none'

const NAV_ORDER: string[][] = [
  ['home-map'],
  ['places'],
  ['chats', 'chat-room'],
  ['login', 'profile', 'user-profile'],
]

export const pageTransition = ref<PageTransitionName>('fade')
export const isPageTransitioning = ref(false)

export function afterPageTransition(fn: () => void): void {
  if (!isPageTransitioning.value) {
    fn()
    return
  }
  const stop = watch(isPageTransitioning, (active) => {
    if (active)
      return
    stop()
    fn()
  })
}

// --- Системный свайп «назад» ---
// Свайп от края в Safari сам уводит страницу своей анимацией. Если поверх сыграть наш слайд,
// переход на айфоне проигрывается дважды. Safari 18+ и Chrome прямо сообщают об этом
// в PopStateEvent.hasUAVisualTransition, для старых iOS — догадываемся по жесту от края экрана

const EDGE_PX = 24
const SWIPE_PX = 30
const SWIPE_WINDOW_MS = 1500

const isIOS = typeof navigator !== 'undefined'
  && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

let edgeStartX: number | null = null
let edgeSwipeAt = 0
let browserAnimated = false

if (typeof window !== 'undefined') {
  const options = { capture: true, passive: true }
  window.addEventListener('touchstart', (event) => {
    const x = event.touches[0]?.clientX ?? -1
    edgeStartX = x >= 0 && (x <= EDGE_PX || x >= window.innerWidth - EDGE_PX) ? x : null
  }, options)
  window.addEventListener('touchmove', (event) => {
    const x = event.touches[0]?.clientX
    if (edgeStartX !== null && x !== undefined && Math.abs(x - edgeStartX) > SWIPE_PX)
      edgeSwipeAt = performance.now()
  }, options)
  // До обработчика vue-router: к afterEach уже известно, анимировал ли переход браузер
  window.addEventListener('popstate', (event) => {
    const reported = (event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition
    browserAnimated = reported ?? (isIOS && performance.now() - edgeSwipeAt < SWIPE_WINDOW_MS)
  }, { capture: true })
}

/** Браузер уже показал свою анимацию перехода — флаг действует на одну навигацию. */
function takeBrowserAnimated(): boolean {
  const animated = browserAnimated
  browserAnimated = false
  return animated
}

function navIndex(name: unknown): number {
  return NAV_ORDER.findIndex(group => group.includes(name as string))
}

export function prefetchNavPages(): void {
  const loaders = [
    () => import('@/components/05.pages/places/PlacesPage.vue'),
    () => import('@/components/05.pages/chats/ChatsPage.vue'),
    () => import('@/components/05.pages/chats/ChatListPage.vue'),
    () => import('@/components/05.pages/profile/ProfilePage.vue'),
    () => import('@/components/05.pages/profile/MyProfilePage.vue'),
    () => import('@/components/05.pages/auth/AuthPage.vue'),
  ]

  const run = () => loaders.forEach(load => load().catch(() => {}))

  if ('requestIdleCallback' in window)
    requestIdleCallback(run, { timeout: 1500 })
  else
    setTimeout(run, 200)
}

export function prefetchNavData(isAuthenticated: boolean): void {
  if (!isAuthenticated)
    return

  const run = async () => {
    const [{ usePlacesStore }, { useChatsStore }] = await Promise.all([
      import('@/components/00.shared/stores/places'),
      import('@/components/00.shared/stores/chats'),
    ])
    usePlacesStore().hydrate().catch(() => {})
    useChatsStore().fetchChats().catch(() => {})
  }

  if ('requestIdleCallback' in window)
    requestIdleCallback(() => void run(), { timeout: 2000 })
  else
    setTimeout(() => void run(), 300)
}

export function resolvePageTransition(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): PageTransitionName {
  if (takeBrowserAnimated())
    return 'none'

  const toDepth = (to.meta.depth as number) || 1
  const fromDepth = (from.meta.depth as number) || 1

  if (toDepth > fromDepth)
    return 'slide-left'
  if (toDepth < fromDepth)
    return 'slide-right'

  const toIndex = navIndex(to.name)
  const fromIndex = navIndex(from.name)

  if (toIndex === -1 || fromIndex === -1 || toIndex === fromIndex) {
    return 'fade'
  }

  return toIndex > fromIndex ? 'slide-left' : 'slide-right'
}
