export type HabitFrequency = 'daily' | 'weekly' | 'monthly'

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

export interface HabitLog {
  id: string
  habit_id: string
  completed_date: string
  notes: string | null
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  frequency: HabitFrequency
  target_days: number[]
  color: string
  icon: string | null
  is_active: boolean
  current_streak: number
  longest_streak: number
  logs: HabitLog[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface HabitStats {
  total_logs: number
  current_streak: number
  longest_streak: number
  completion_rate: number
  logs_this_week: number
  logs_this_month: number
}

export interface HabitHeatmapEntry {
  date: string
  count: number
}

export interface CreateHabitPayload {
  name: string
  description?: string
  frequency: HabitFrequency
  target_days?: number[]
  color?: string
  icon?: string
}

export type UpdateHabitPayload = Partial<CreateHabitPayload>

export interface LogHabitPayload {
  date?: string
  notes?: string
}
