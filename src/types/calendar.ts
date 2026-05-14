export type EventSource = 'manual' | 'google' | 'import'
export type EventColor =
  | 'slate'
  | 'blue'
  | 'violet'
  | 'green'
  | 'yellow'
  | 'red'
  | 'pink'
  | 'orange'

export type ViewMode = 'month' | 'week' | 'agenda'

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  location: string | null
  start_date: string
  end_date: string
  is_all_day: boolean
  color: EventColor | null
  source: EventSource
  external_id: string | null
  recurrence_rule: string | null
  created_at: string
  updated_at: string
}

export interface CreateCalendarEventPayload {
  title: string
  description?: string
  location?: string
  start_date: string
  end_date: string
  is_all_day?: boolean
  color?: EventColor
  recurrence_rule?: string
}

export type UpdateCalendarEventPayload = Partial<CreateCalendarEventPayload>

export interface CalendarFilters {
  start_date?: string
  end_date?: string
  search?: string
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  events: CalendarEvent[]
}

export type CalendarWeek = [
  CalendarDay,
  CalendarDay,
  CalendarDay,
  CalendarDay,
  CalendarDay,
  CalendarDay,
  CalendarDay,
]
