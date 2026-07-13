import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import { useOnboarding } from '@/components/02.features/Onboarding/model/useOnboarding'

const AuthProcessingComponent = {
  template: '<div style="display:flex;justify-content:center;align-items:center;height:100vh;">Авторизация...</div>',
}

const routes = [
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/components/05.pages/WelcomePage.vue'),
    meta: {
      requiresAuth: false,
      layout: 'empty',
    },
  },
  {
    path: '/',
    name: 'home-map',
    component: () => import('@/components/05.pages/HomeMapPage.vue'),
    meta: {
      layout: 'default',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/components/05.pages/AuthPage.vue'),
    meta: {
      layout: 'default',
      guestOnly: true,
    },
  },

  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/components/05.pages/ProfilePage.vue'),
    meta: {
      layout: 'default',
      requiresAuth: true,
    },
  },

  {
    path: '/chats',
    name: 'chats',
    component: () => import('@/components/05.pages/ChatsPage.vue'),
    meta: {
      layout: 'default',
      requiresAuth: true,
    },
  },

  {
    path: '/oauth/google',
    name: 'google-auth-callback',
    component: AuthProcessingComponent,
    beforeEnter: async (
      to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext,
    ) => {
      const authStore = useAuthStore()
      const token = to.query.token as string

      if (token) {
        try {
          authStore.setToken(token)

          await authStore.fetchUser()

          return next({ name: 'home-map', replace: true })
        }
        catch (e) {
          console.error('Ошибка Google Auth:', e)
          return next({ name: 'home-map' })
        }
      }

      next({ name: 'home-map' })
    },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/components/05.pages/NotFoundPage.vue'),
    meta: {
      layout: 'empty',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const { hasSeenOnboarding } = useOnboarding()

  const seen = await hasSeenOnboarding()
  const isAuthenticated = authStore.isAuthenticated
  const isWelcomePage = to.name === 'Welcome'

  if (!seen && !isWelcomePage) {
    return next({ name: 'Welcome' })
  }
  if (seen && isWelcomePage) {
    return next({ name: 'home-map' })
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: 'profile' })
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
  }

  next()
})

export default router
