import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/components/02.features/authentication/model/auth'

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

router.beforeEach(async (to, from, next) => {
  const normalizedPath = to.path.replace(/\/$/, '')

  if (normalizedPath === '/oauth/google' && to.query.token) {
    const authStore = useAuthStore()
    const token = to.query.token as string

    try {
      authStore.setToken(token)

      await authStore.fetchUser()

      return next({ name: 'home-map' })
    }
    catch (error) {
      console.error('Router Auth Error:', error)
      return next({ name: 'home-map' })
    }
  }

  next()
})

export default router
