import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './routes/auth'
import { appRoutes } from './routes/app'
import { registerGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...appRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(_, __, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

registerGuards(router)

export default router
