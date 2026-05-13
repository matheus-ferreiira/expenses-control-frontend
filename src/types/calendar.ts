export type EventSource = 'manual' | 'google'
export type EventColor =
  | 'slate'
  | 'blue'
  | 'violet'
  | 'green'
  | 'yellow'
  | 'red'
  | 'pink'
  | 'orange'

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  location: string | null
  start_datetime: string
  end_datetime: string
  all_day: boolean
  color: EventColor
  source: EventSource
  external_id: string | null
  is_recurring: boolean
  recurrence_pattern: string | null
  recurrence_ends_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateCalendarEventPayload {
  title: string
  description?: string
  location?: string
  start_datetime: string
  end_datetime: string
  all_day?: boolean
  color?: EventColor
  is_recurring?: boolean
  recurrence_pattern?: string
  recurrence_ends_at?: string
}

export type UpdateCalendarEventPayload = Partial<CreateCalendarEventPayload>

export interface CalendarFilters {
  start?: string
  end?: string
  search?: string
}
