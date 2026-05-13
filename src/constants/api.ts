export const API_BASE = '/api/v1'

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    LOGOUT: `${API_BASE}/auth/logout`,
    ME: `${API_BASE}/auth/me`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
  },
  TASKS: {
    BASE: `${API_BASE}/tasks`,
    DETAIL: (id: string) => `${API_BASE}/tasks/${id}`,
    ARCHIVE: (id: string) => `${API_BASE}/tasks/${id}/archive`,
    REORDER: `${API_BASE}/tasks/reorder`,
    SUBTASKS: (taskId: string) => `${API_BASE}/tasks/${taskId}/subtasks`,
    SUBTASK_DETAIL: (taskId: string, id: string) =>
      `${API_BASE}/tasks/${taskId}/subtasks/${id}`,
    LABELS: `${API_BASE}/task-labels`,
    LABEL_DETAIL: (id: string) => `${API_BASE}/task-labels/${id}`,
  },
  HABITS: {
    BASE: `${API_BASE}/habits`,
    DETAIL: (id: string) => `${API_BASE}/habits/${id}`,
    LOG: (id: string) => `${API_BASE}/habits/${id}/log`,
    UNLOG: (id: string) => `${API_BASE}/habits/${id}/log`,
    ARCHIVE: (id: string) => `${API_BASE}/habits/${id}/archive`,
    UNARCHIVE: (id: string) => `${API_BASE}/habits/${id}/unarchive`,
    STATS: (id: string) => `${API_BASE}/habits/${id}/stats`,
    HEATMAP: (id: string) => `${API_BASE}/habits/${id}/heatmap`,
    TODAY: `${API_BASE}/habits/today`,
  },
  FINANCE: {
    ACCOUNTS: `${API_BASE}/finance/accounts`,
    ACCOUNT_DETAIL: (id: string) => `${API_BASE}/finance/accounts/${id}`,
    CARDS: `${API_BASE}/finance/cards`,
    CARD_DETAIL: (id: string) => `${API_BASE}/finance/cards/${id}`,
    TRANSACTIONS: `${API_BASE}/finance/transactions`,
    TRANSACTION_DETAIL: (id: string) => `${API_BASE}/finance/transactions/${id}`,
    CATEGORIES: `${API_BASE}/finance/categories`,
    CATEGORY_DETAIL: (id: string) => `${API_BASE}/finance/categories/${id}`,
    REPORTS: `${API_BASE}/finance/reports`,
  },
  GOALS: {
    BASE: `${API_BASE}/goals`,
    DETAIL: (id: string) => `${API_BASE}/goals/${id}`,
    PROGRESS: (id: string) => `${API_BASE}/goals/${id}/progress`,
  },
  CALENDAR: {
    BASE: `${API_BASE}/calendar`,
    DETAIL: (id: string) => `${API_BASE}/calendar/${id}`,
    UPCOMING: `${API_BASE}/calendar/upcoming`,
  },
  DASHBOARD: `${API_BASE}/dashboard`,
  PURCHASES: {
    BASE: `${API_BASE}/purchases`,
    DETAIL: (id: string) => `${API_BASE}/purchases/${id}`,
  },
} as const
