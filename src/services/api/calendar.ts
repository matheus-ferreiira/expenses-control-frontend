import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type {
  CalendarEvent,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
  CalendarFilters,
} from '@/types/calendar'

export const calendarApi = {
  list: (filters?: CalendarFilters) =>
    client
      .get<ApiResponse<CalendarEvent[]>>(API_ENDPOINTS.CALENDAR.BASE, { params: filters })
      .then(unwrap),

  get: (id: string) =>
    client.get<ApiResponse<CalendarEvent>>(API_ENDPOINTS.CALENDAR.DETAIL(id)).then(unwrap),

  create: (payload: CreateCalendarEventPayload) =>
    client.post<ApiResponse<CalendarEvent>>(API_ENDPOINTS.CALENDAR.BASE, payload).then(unwrap),

  update: (id: string, payload: UpdateCalendarEventPayload) =>
    client
      .put<ApiResponse<CalendarEvent>>(API_ENDPOINTS.CALENDAR.DETAIL(id), payload)
      .then(unwrap),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(API_ENDPOINTS.CALENDAR.DETAIL(id)).then(unwrap),

  upcoming: (days?: number) =>
    client
      .get<ApiResponse<CalendarEvent[]>>(API_ENDPOINTS.CALENDAR.UPCOMING, { params: { days } })
      .then(unwrap),
}
