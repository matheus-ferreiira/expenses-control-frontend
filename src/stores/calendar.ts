import { ref } from 'vue'
import { defineStore } from 'pinia'
import { calendarApi } from '@/services/api/calendar'
import { startOfMonth, endOfMonth, toMonthKey } from '@/features/calendar/utils/calendarHelpers'
import type {
  CalendarEvent,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
} from '@/types/calendar'

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref<CalendarEvent[]>([])
  const upcoming = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Session cache: key = 'YYYY-MM' → fetched event IDs (used to avoid re-fetching)
  const fetchedMonths = new Set<string>()

  async function fetchForMonth(year: number, month: number) {
    const key = toMonthKey(year, month)
    if (fetchedMonths.has(key)) return
    loading.value = true
    error.value = null
    try {
      const start = startOfMonth(year, month).toISOString()
      const end = endOfMonth(year, month).toISOString()
      const fetched = await calendarApi.list({ start_date: start, end_date: end })
      fetchedMonths.add(key)
      mergeEvents(fetched)
    } catch {
      error.value = 'Erro ao carregar eventos'
    } finally {
      loading.value = false
    }
  }

  function mergeEvents(incoming: CalendarEvent[]) {
    const existingIds = new Set(events.value.map((e) => e.id))
    for (const ev of incoming) {
      if (!existingIds.has(ev.id)) {
        events.value.push(ev)
      }
    }
  }

  function invalidateMonth(year: number, month: number) {
    fetchedMonths.delete(toMonthKey(year, month))
  }

  async function fetchUpcoming() {
    upcoming.value = await calendarApi.upcoming()
  }

  async function createEvent(payload: CreateCalendarEventPayload): Promise<CalendarEvent> {
    const event = await calendarApi.create(payload)
    events.value.push(event)
    // Invalidate the month so next visit re-fetches with server state
    const d = new Date(event.start_date)
    invalidateMonth(d.getFullYear(), d.getMonth())
    return event
  }

  async function updateEvent(
    id: string,
    payload: UpdateCalendarEventPayload,
  ): Promise<CalendarEvent> {
    // Optimistic update
    const idx = events.value.findIndex((e) => e.id === id)
    const previous: CalendarEvent | null = idx !== -1 ? (JSON.parse(JSON.stringify(events.value[idx])) as CalendarEvent) : null
    if (idx !== -1) {
      events.value[idx] = Object.assign({}, events.value[idx], payload) as CalendarEvent
    }
    try {
      const updated = await calendarApi.update(id, payload)
      if (idx !== -1) events.value[idx] = updated
      return updated
    } catch (e) {
      // Rollback
      if (idx !== -1 && previous) events.value[idx] = previous
      throw e
    }
  }

  async function deleteEvent(id: string) {
    // Optimistic delete
    const idx = events.value.findIndex((e) => e.id === id)
    const previous = idx !== -1 ? events.value.splice(idx, 1)[0] : null
    try {
      await calendarApi.delete(id)
    } catch (e) {
      // Rollback
      if (previous) events.value.push(previous)
      throw e
    }
  }

  return {
    events,
    upcoming,
    loading,
    error,
    fetchForMonth,
    fetchUpcoming,
    createEvent,
    updateEvent,
    deleteEvent,
  }
})
