import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type { YearlySummary, WeeklyProductivity } from '@/types/reports'

export const reportsApi = {
  yearlyFinance: (year: number) =>
    client
      .get<ApiResponse<YearlySummary>>(API_ENDPOINTS.FINANCE.REPORTS_YEARLY, { params: { year } })
      .then(unwrap),

  weeklyProductivity: () =>
    client
      .get<ApiResponse<WeeklyProductivity>>(API_ENDPOINTS.REPORTS.WEEKLY_PRODUCTIVITY)
      .then(unwrap),
}
