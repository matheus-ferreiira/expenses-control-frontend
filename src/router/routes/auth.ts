import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/constants/routes'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresGuest: true },
    children: [
      {
        path: '',
        redirect: { name: ROUTES.LOGIN },
      },
      {
        path: 'login',
        name: ROUTES.LOGIN,
        component: () => import('@/pages/auth/LoginPage.vue'),
      },
      {
        path: 'register',
        name: ROUTES.REGISTER,
        component: () => import('@/pages/auth/RegisterPage.vue'),
      },
      {
        path: 'forgot-password',
        name: ROUTES.FORGOT_PASSWORD,
        component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
      },
      {
        path: 'reset-password',
        name: ROUTES.RESET_PASSWORD,
        component: () => import('@/pages/auth/ResetPasswordPage.vue'),
      },
    ],
  },
]
