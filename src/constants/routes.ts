export const ROUTES = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot-password',
  RESET_PASSWORD: 'reset-password',

  DASHBOARD: 'dashboard',

  TASKS: 'tasks',
  TASK_DETAIL: 'task-detail',

  HABITS: 'habits',
  HABIT_DETAIL: 'habit-detail',

  FINANCE: 'finance',
  FINANCE_TRANSACTIONS: 'finance-transactions',
  FINANCE_ACCOUNTS: 'finance-accounts',
  FINANCE_CARDS: 'finance-cards',
  FINANCE_REPORTS: 'finance-reports',
  FINANCE_REPORTS_YEARLY: 'finance-reports-yearly',
  FINANCE_CATEGORIES: 'finance-categories',
  FINANCE_BUDGET: 'finance-budget',
  FINANCE_GOALS: 'finance-goals',

  GOALS: 'goals',
  GOAL_DETAIL: 'goal-detail',

  CALENDAR: 'calendar',

  REPORTS: 'reports',

  PURCHASES: 'purchases',

  NOTES: 'notes',
  DAILY_LOG: 'daily-log',
  BOOKMARKS: 'bookmarks',
  VAULT: 'vault',

  SETTINGS: 'settings',

  GOOGLE_CALLBACK: 'google-callback',
} as const

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES]
