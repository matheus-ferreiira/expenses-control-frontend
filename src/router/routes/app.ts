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
      // Produtividade
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
        path: 'finance',
        name: ROUTES.FINANCE,
        component: () => import('@/pages/finance/FinancePage.vue'),
      },
      {
        path: 'finance/transactions',
        name: ROUTES.FINANCE_TRANSACTIONS,
        component: () => import('@/pages/finance/TransactionsPage.vue'),
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
        path: 'finance/reports',
        name: ROUTES.FINANCE_REPORTS,
        component: () => import('@/pages/finance/MonthlyReportPage.vue'),
      },
      {
        path: 'reports',
        name: ROUTES.REPORTS,
        component: () => import('@/pages/ReportsPage.vue'),
      },
      // Pessoal
      {
        path: 'purchases',
        name: ROUTES.PURCHASES,
        component: () => import('@/pages/purchases/PurchasesPage.vue'),
      },
      {
        path: 'notes',
        name: ROUTES.NOTES,
        component: () => import('@/pages/notes/NotesPage.vue'),
      },
      {
        path: 'daily-log',
        name: ROUTES.DAILY_LOG,
        component: () => import('@/pages/DailyLogPage.vue'),
      },
      {
        path: 'bookmarks',
        name: ROUTES.BOOKMARKS,
        component: () => import('@/pages/BookmarksPage.vue'),
      },
      {
        path: 'vault',
        name: ROUTES.VAULT,
        component: () => import('@/pages/VaultPage.vue'),
      },
      // Sistema
      {
        path: 'settings',
        name: ROUTES.SETTINGS,
        component: () => import('@/pages/SettingsPage.vue'),
      },
    ],
  },
]
