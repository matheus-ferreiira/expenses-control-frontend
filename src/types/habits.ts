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
  color: string | null
  icon: string | null
  is_active: boolean
  is_archived: boolean
  current_streak: number
  longest_streak: number
  logs: HabitLog[]
  start_date: string | null
  created_at: string
  updated_at: string
}

export interface HabitStats {
  current_streak: number
  longest_streak: number
  completion_rate_30d: number
  completion_rate_7d: number
  completed_today: boolean
  completed_this_week: number
  completed_this_month: number
  total_completed: number
}

export interface HabitHeatmapEntry {
  date: string
  count: number
}

export interface CreateHabitPayload {
  name: string
  description?: string
  frequency_type: HabitFrequency
  target_days?: number[]
  color?: string
  icon?: string
}

export type UpdateHabitPayload = Partial<CreateHabitPayload>

export interface LogHabitPayload {
  date?: string
  notes?: string
}
