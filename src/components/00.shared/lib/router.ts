import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import type { RouteSeo } from '@/components/00.shared/lib/seo'
import { createRouter, createWebHistory } from 'vue-router'
import { pageTransition, resolvePageTransition } from '@/components/00.shared/lib/pageTransition'
import { applyRouteSeo } from '@/components/00.shared/lib/seo'
import { useOnboarding } from '@/components/02.features/app/Onboarding/model/useOnboarding'
import { useAuthStore } from '@/components/02.features/auth/Authentication/model/auth'

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
      depth: 1,
      seo: {
        title: 'Знакомство',
        description: 'RealTimeMap — карта мест рядом с вами: метки, маршруты и живые события.',
      },
    },
  },
  {
    path: '/',
    name: 'home-map',
    component: () => import('@/components/05.pages/map/HomeMapPage.vue'),
    meta: {
      layout: 'default',
      fullBleed: true,
      depth: 1,
      seo: {
        title: 'Карта',
        description: 'Интерактивная карта: метки людей вокруг, маршруты и события рядом с вами.',
      },
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/components/05.pages/auth/AuthPage.vue'),
    meta: {
      layout: 'default',
      guestOnly: true,
      depth: 1,
      seo: {
        title: 'Вход и регистрация',
        description: 'Войдите или зарегистрируйтесь, чтобы ставить метки, оценивать места и общаться.',
      },
    },
  },

  {
    path: '/profile',
    component: () => import('@/components/05.pages/profile/ProfilePage.vue'),
    meta: {
      layout: 'default',
      fullBleed: true,
      depth: 1,
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
          depth: 1,
        },
        component: () => import('@/components/05.pages/profile/MyProfilePage.vue'),
      },
      {
        path: ':userId(\\d+)',
        name: 'user-profile',
        meta: {
          seo: {
            title: 'Профиль',
            description: 'Профиль пользователя: метки, достижения и активность на карте.',
          },
          depth: 2,
        },
        component: () => import('@/components/05.pages/profile/UserProfilePage.vue'),
        props: route => ({ userId: Number(route.params.userId) }),
      },
    ],
  },

  {
    path: '/places',
    name: 'places',
    component: () => import('@/components/05.pages/places/PlacesPage.vue'),
    meta: {
      layout: 'default',
      requiresAuth: true,
      fullBleed: true,
      depth: 1,
      seo: {
        title: 'Мои места',
        description: 'Личные метки, списки и группы в RealTimeMap.',
      },
    },
  },

  {
    path: '/chats',
    component: () => import('@/components/05.pages/chats/ChatsPage.vue'),
    meta: {
      layout: 'default',
      requiresAuth: true,
      fullBleed: true,
      depth: 1,
    },
    children: [
      {
        path: '',
        name: 'chats',
        component: () => import('@/components/05.pages/chats/ChatListPage.vue'),
        meta: {
          depth: 1,
          seo: {
            title: 'Чаты',
            description: 'Ваши переписки в RealTimeMap.',
          },
        },
      },
      {
        path: ':chatId(\\d+)',
        name: 'chat-room',
        component: () => import('@/components/05.pages/chats/ChatRoomPage.vue'),
        props: route => ({ chatId: Number(route.params.chatId) }),
        meta: {
          depth: 2,
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
    path: '/password-reset',
    name: 'reset-password',
    component: () => import('@/components/05.pages/auth/ResetPasswordPage.vue'),
    meta: {
      layout: 'empty',
      depth: 1,
      seo: {
        title: 'Восстановление пароля',
        description: 'Установите новый пароль для входа в RealTimeMap.',
      },
    },
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
      depth: 1,
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
  // Сброс пароля — deep-link из письма, должен открываться до онбординга.
  const isResetPassword = to.name === 'reset-password'

  if (!seen && !isWelcomePage && !isResetPassword) {
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

router.afterEach((to, from) => {
  pageTransition.value = resolvePageTransition(to, from)
  applyRouteSeo(to.meta.seo as RouteSeo | undefined)
})

export default router
