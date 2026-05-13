import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants/routes'

export function registerGuards(router: Router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: ROUTES.LOGIN, query: { redirect: to.fullPath } }
    }

    if (to.meta.requiresGuest && auth.isAuthenticated) {
      return { name: ROUTES.DASHBOARD }
    }
  })
}
