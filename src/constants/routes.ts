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
  FINANCE_ACCOUNTS: 'finance-accounts',
  FINANCE_CARDS: 'finance-cards',
  FINANCE_REPORTS: 'finance-reports',

  GOALS: 'goals',
  GOAL_DETAIL: 'goal-detail',

  CALENDAR: 'calendar',

  REPORTS: 'reports',

  PURCHASES: 'purchases',

  SETTINGS: 'settings',
} as const

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES]
