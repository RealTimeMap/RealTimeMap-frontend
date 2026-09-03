import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import type { RouteSeo } from '@/components/00.shared/lib/seo'
import { createRouter, createWebHistory } from 'vue-router'
import { applyRouteSeo } from '@/components/00.shared/lib/seo'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import { useOnboarding } from '@/components/02.features/Onboarding/model/useOnboarding'

const AuthProcessingComponent = {
  template: '<div style="display:flex;justify-content:center;align-items:center;height:100vh;">Авторизация...</div>',
}

const routes: RouteRecordRaw[] = [
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/components/05.pages/WelcomePage.vue'),
    meta: {
      requiresAuth: false,
      layout: 'empty',
      seo: {
        title: 'Знакомство',
        description: 'RealTimeMap — карта мест рядом с вами: метки, маршруты и живые события.',
      },
    },
  },
  {
    path: '/',
    name: 'home-map',
    component: () => import('@/components/05.pages/HomeMapPage.vue'),
    meta: {
      layout: 'default',
      fullBleed: true,
      seo: {
        title: 'Карта',
        description: 'Интерактивная карта: метки людей вокруг, маршруты и события рядом с вами.',
      },
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/components/05.pages/AuthPage.vue'),
    meta: {
      layout: 'default',
      guestOnly: true,
      seo: {
        title: 'Вход и регистрация',
        description: 'Войдите или зарегистрируйтесь, чтобы ставить метки, оценивать места и общаться.',
      },
    },
  },

  {
    path: '/profile',
    component: () => import('@/components/05.pages/ProfilePage.vue'),
    meta: {
      layout: 'default',
    },
    children: [
      {
        path: '',
        redirect: { name: 'profile' },
      },
      {
        path: 'me',
        name: 'profile',
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Мой профиль',
            description: 'Ваш уровень, достижения, статистика и метки на карте.',
          },
        },
        component: () => import('@/components/05.pages/Profile/MyProfilePage.vue'),
      },
      {
        path: ':userId(\\d+)',
        name: 'user-profile',
        meta: {
          seo: {
            title: 'Профиль',
            description: 'Профиль пользователя: метки, достижения и активность на карте.',
          },
        },
        component: () => import('@/components/05.pages/Profile/UserProfilePage.vue'),
        props: route => ({ userId: Number(route.params.userId) }),
      },
    ],
  },

  {
    path: '/chats',
    component: () => import('@/components/05.pages/ChatsPage.vue'),
    meta: {
      layout: 'default',
      requiresAuth: true,
      fullBleed: true,
    },
    children: [
      {
        path: '',
        name: 'chats',
        component: () => import('@/components/05.pages/Chats/ChatListPage.vue'),
        meta: {
          seo: {
            title: 'Чаты',
            description: 'Ваши переписки в RealTimeMap.',
          },
        },
      },
      {
        path: ':chatId(\\d+)',
        name: 'chat-room',
        component: () => import('@/components/05.pages/Chats/ChatRoomPage.vue'),
        props: route => ({ chatId: Number(route.params.chatId) }),
        meta: {
          hideBottomNav: true,
          seo: {
            title: 'Чат',
            description: 'Переписка в RealTimeMap.',
          },
        },
      },
    ],
  },

  {
    path: '/oauth/google',
    name: 'google-auth-callback',
    component: AuthProcessingComponent,
    beforeEnter: async (to: RouteLocationNormalized) => {
      const authStore = useAuthStore()
      const token = to.query.token as string

      if (token) {
        try {
          authStore.setToken(token)

          await authStore.fetchUser()
        }
        catch (e) {
          console.error('Ошибка Google Auth:', e)
        }
      }

      return { name: 'home-map' }
    },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/components/05.pages/NotFoundPage.vue'),
    meta: {
      layout: 'empty',
      seo: {
        title: 'Страница не найдена',
        description: 'Такой страницы нет. Вернитесь на карту RealTimeMap.',
      },
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const { hasSeenOnboarding } = useOnboarding()

  const seen = await hasSeenOnboarding()
  const isAuthenticated = authStore.isAuthenticated
  const isWelcomePage = to.name === 'Welcome'

  if (!seen && !isWelcomePage) {
    return { name: 'Welcome' }
  }
  if (seen && isWelcomePage) {
    return { name: 'home-map' }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { name: 'profile' }
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  return true
})

router.afterEach((to) => {
  applyRouteSeo(to.meta.seo as RouteSeo | undefined)
})

export default router
