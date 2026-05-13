import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/constants/routes'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: ROUTES.LOGIN,
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: ROUTES.REGISTER,
    component: () => import('@/pages/auth/RegisterPage.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/forgot-password',
    name: ROUTES.FORGOT_PASSWORD,
    component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/reset-password',
    name: ROUTES.RESET_PASSWORD,
    component: () => import('@/pages/auth/ResetPasswordPage.vue'),
    meta: { requiresGuest: true },
  },
]
