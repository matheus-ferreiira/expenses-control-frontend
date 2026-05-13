import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'

export interface DashboardData {
  tasks_today: number
  tasks_overdue: number
  tasks_this_week: number
  habits_today: number
  habits_completed_today: number
  finance_balance: number
  finance_income_month: number
  finance_expenses_month: number
  goals_active: number
  goals_completed: number
  upcoming_events: number
}

export const dashboardApi = {
  get: () =>
    client.get<ApiResponse<DashboardData>>(API_ENDPOINTS.DASHBOARD).then(unwrap),
}
