export type {
  Habit,
  HabitLog,
  HabitStats,
  HabitHeatmapEntry,
  HabitFrequency,
  CreateHabitPayload,
  UpdateHabitPayload,
  LogHabitPayload,
} from '@/types/habits'

export { HABIT_FREQUENCY_LABELS } from '@/types/habits'

export type ViewMode = 'grid' | 'list'

export interface HabitColor {
  value: string
  label: string
}

export const HABIT_COLORS: HabitColor[] = [
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#f97316', label: 'Laranja' },
]

export const FREQUENCY_STYLE: Record<
  import('@/types/habits').HabitFrequency,
  { text: string; bg: string }
> = {
  daily:   { text: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  weekly:  { text: 'text-violet-400', bg: 'bg-violet-400/10' },
  monthly: { text: 'text-orange-400', bg: 'bg-orange-400/10' },
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

export interface DotDay {
  date: string
  dayOfWeek: number
  dayLabel: string
  isTarget: boolean
  isLogged: boolean
  isToday: boolean
  isFuture: boolean
}

export interface HeatmapCell {
  date: string
  count: number
  isEmpty: boolean
}
