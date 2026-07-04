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
        redirect: { name: ROUTES.TASKS },
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
        // Tela antiga fundida na Visão Geral — mantém links/atalhos funcionando
        path: 'finance/transactions',
        name: ROUTES.FINANCE_TRANSACTIONS,
        redirect: { name: ROUTES.FINANCE },
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
        path: 'finance/reports/yearly',
        name: ROUTES.FINANCE_REPORTS_YEARLY,
        component: () => import('@/pages/finance/YearlyReportPage.vue'),
      },
      {
        path: 'finance/categories',
        name: ROUTES.FINANCE_CATEGORIES,
        component: () => import('@/pages/finance/CategoriesPage.vue'),
      },
      {
        path: 'finance/budget',
        name: ROUTES.FINANCE_BUDGET,
        component: () => import('@/pages/finance/BudgetPage.vue'),
      },
      {
        path: 'finance/goals',
        name: ROUTES.FINANCE_GOALS,
        component: () => import('@/pages/finance/GoalsPage.vue'),
      },
      {
        path: 'reports',
        name: ROUTES.REPORTS,
        component: () => import('@/pages/ReportsPage.vue'),
      },
      // Preços
      {
        path: 'prices',
        name: ROUTES.PRICES,
        component: () => import('@/pages/prices/PricesDashboardPage.vue'),
      },
      {
        path: 'prices/records',
        name: ROUTES.PRICES_RECORDS,
        component: () => import('@/pages/prices/PriceRecordsPage.vue'),
      },
      {
        path: 'prices/products',
        name: ROUTES.PRICES_PRODUCTS,
        component: () => import('@/pages/prices/PriceProductsPage.vue'),
      },
      {
        path: 'prices/products/:id',
        name: ROUTES.PRICES_PRODUCT_DETAIL,
        component: () => import('@/pages/prices/PriceProductDetailPage.vue'),
      },
      {
        path: 'prices/purchases',
        name: ROUTES.PRICES_PURCHASES,
        component: () => import('@/pages/prices/PricePurchasesPage.vue'),
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
