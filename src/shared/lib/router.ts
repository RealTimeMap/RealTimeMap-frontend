import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/components/02.features/authentication/model/auth'

const AuthProcessingComponent = { template: '<div style="display:flex;justify-content:center;align-items:center;height:100vh;">Авторизация...</div>' }

const routes = [
  {
    path: '/',
    name: 'home-map',
    component: () => import('@/pages/home-map.vue'),
    meta: {
      layout: 'default',
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
    component: () => import('@/pages/not-found.vue'),
    meta: {
      layout: 'empty',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
