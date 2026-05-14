export type ReportPeriod = '7d' | '30d' | '90d' | '1y'

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  '1y': '1 ano',
}

export const REPORT_PERIODS: ReportPeriod[] = ['7d', '30d', '90d', '1y']

export interface YearlyMonth {
  month: number
  income: number
  expenses: number
  balance: number
}

export interface YearlySummary {
  year: number
  months: YearlyMonth[]
}

export interface WeeklyHabitStat {
  id: string
  name: string
  color: string
  current_streak: number
  longest_streak: number
  completion_rate_7d: number
  completion_rate_30d: number
  completed_today: boolean
  completed_this_week: number
  completed_this_month: number
  total_completed: number
}

export interface WeeklyProductivity {
  habits: WeeklyHabitStat[]
}
