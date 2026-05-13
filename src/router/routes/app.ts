import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '@/constants/routes'

export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: ROUTES.DASHBOARD },
      },
      {
        path: 'dashboard',
        name: ROUTES.DASHBOARD,
        component: () => import('@/pages/DashboardPage.vue'),
      },
      {
        path: 'tasks',
        name: ROUTES.TASKS,
        component: () => import('@/pages/tasks/TasksPage.vue'),
      },
      {
        path: 'tasks/:id',
        name: ROUTES.TASK_DETAIL,
        component: () => import('@/pages/tasks/TaskDetailPage.vue'),
      },
      {
        path: 'habits',
        name: ROUTES.HABITS,
        component: () => import('@/pages/habits/HabitsPage.vue'),
      },
      {
        path: 'habits/:id',
        name: ROUTES.HABIT_DETAIL,
        component: () => import('@/pages/habits/HabitDetailPage.vue'),
      },
      {
        path: 'finance',
        name: ROUTES.FINANCE,
        component: () => import('@/pages/finance/FinancePage.vue'),
      },
      {
        path: 'finance/accounts',
        name: ROUTES.FINANCE_ACCOUNTS,
        component: () => import('@/pages/finance/AccountsPage.vue'),
      },
      {
        path: 'finance/cards',
        name: ROUTES.FINANCE_CARDS,
        component: () => import('@/pages/finance/CardsPage.vue'),
      },
      {
        path: 'goals',
        name: ROUTES.GOALS,
        component: () => import('@/pages/goals/GoalsPage.vue'),
      },
      {
        path: 'goals/:id',
        name: ROUTES.GOAL_DETAIL,
        component: () => import('@/pages/goals/GoalDetailPage.vue'),
      },
      {
        path: 'calendar',
        name: ROUTES.CALENDAR,
        component: () => import('@/pages/calendar/CalendarPage.vue'),
      },
      {
        path: 'reports',
        name: ROUTES.REPORTS,
        component: () => import('@/pages/ReportsPage.vue'),
      },
      {
        path: 'purchases',
        name: ROUTES.PURCHASES,
        component: () => import('@/pages/purchases/PurchasesPage.vue'),
      },
    ],
  },
]
