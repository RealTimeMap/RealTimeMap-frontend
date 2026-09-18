import type { RouteLocationNormalized } from 'vue-router'

export type PageTransitionName = 'slide-left' | 'slide-right' | 'fade'

const NAV_ORDER: string[][] = [
  ['home-map'],
  ['places'],
  ['chats', 'chat-room'],
  ['login', 'profile', 'user-profile'],
]

export const pageTransition = ref<PageTransitionName>('fade')

function navIndex(name: unknown): number {
  return NAV_ORDER.findIndex(group => group.includes(name as string))
}

export function prefetchNavPages(): void {
  const loaders = [
    () => import('@/components/05.pages/PlacesPage.vue'),
    () => import('@/components/05.pages/ChatsPage.vue'),
    () => import('@/components/05.pages/Chats/ChatListPage.vue'),
    () => import('@/components/05.pages/ProfilePage.vue'),
    () => import('@/components/05.pages/Profile/MyProfilePage.vue'),
    () => import('@/components/05.pages/AuthPage.vue'),
  ]

  const run = () => loaders.forEach(load => load().catch(() => {}))

  if ('requestIdleCallback' in window)
    requestIdleCallback(run)
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
    requestIdleCallback(() => void run())
  else
    setTimeout(() => void run(), 300)
}

export function resolvePageTransition(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): PageTransitionName {
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
